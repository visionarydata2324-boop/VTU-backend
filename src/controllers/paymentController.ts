import { AuthService } from "./../middleware/Auth";
import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { AppError } from "../utils/HandleErrors";
import { logger } from "../utils/logger";
import { config } from "dotenv";
import { monifyService } from "../services/payment";
import { PaymentDetails, TransactionResponse } from "../utils/types/payment";
import {
  Transaction,
  TransactionStatusEnum,
  TransactionType,
} from "../models/transactions";
import { UserRequest } from "../utils/types/index";
import { Data } from "../models/dataPlans";
import User from "../models/users";
import { walletService } from "../services/inApp_wallet";
import Wallet, { IWalletDocument } from "../models/wallet";
import { ErrorCodes } from "../utils/errorCodes";
import mongoose from "mongoose";

config(); // Changed to config() as configDotenv is deprecated

// More specific typing for the change stream operations
type WalletOperationType = "insert" | "update" | "replace" | "delete";


class PaymentController {
  private counter;
  constructor() {
    this.counter = 0;
  }
 public generateReference = async () => {
      const timestamp = Date.now();
      this.counter++;
      return `PAY_${timestamp}-${this.counter.toString().padStart(4, "0")}`;
    };

public initializePayment = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sku, paymentDescription, amount, paymentCategory, servicePaidFor } = req.body;

    const paymentRef = await this.generateReference();

    const details: PaymentDetails = {
      amount,
      paymentCategory,
      customerEmail: req.user.user.email,
      customerName: `${req.user.user.firstName} ${req.user.user.lastName}`,
      paymentDescription,
      paymentReference: paymentRef,
      contractCode: process.env.MONNIFY_CONTRACT_CODE!,
      currencyCode: "NGN",
      redirectUrl: process.env.PAYMENT_REDIRECT_URL!,
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
      metaData: { servicePaidFor },
    };

    const payment = await monifyService.initiatePayment(details);

    if (!payment) {
      throw new AppError("Payment initialization failed", 400, ErrorCodes.PAY__001);
    }

    const createTransaction = await Transaction.create({
      user: req.user.user.id,
      paymentCategory,
      type: TransactionType.Wallet,
      amount: details.amount,
      status: TransactionStatusEnum.PENDING,
      paymentReference: details.paymentReference, // Use same reference
      transactionReference: payment.responseBody.transactionReference,
      metadata: {
        paymentDescription: details.paymentDescription,
        customer: details.customerName,
        paymentStatus: TransactionStatusEnum.PENDING,
      },
    });

    await User.findByIdAndUpdate(req.user.user.id, {
      $push: { transactions: createTransaction._id },
    });

    res.status(200).json({
      success: true,
      data: payment,
    });

  } catch (error: any) {
    logger.error( error.message );
    res.status(error.statusCode || 500).json({ error: error.message || "Internal Server Error" });
  }
};


  async verifyTransaction(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { transactionReference } = req.query;
      const reference = transactionReference.toString();
      if (transactionReference[0] !== "M") {
        throw new AppError("Invalid transaction reference");
      }
      const transaction = await monifyService.verifyPayment(reference);
      console.log({ transaction });
      if (!transaction || !transaction.requestSuccessful) {
        throw new AppError("Transaction not found", 404);
      }
      const data = transaction.responseBody;
      if (data.paymentStatus !== "PAID") {
        throw new AppError("Transaction not paid");
      }
      const updateTransaction = await Transaction.findOneAndUpdate(
        { transactionReference: data.transactionReference },
        {
          $set: {
            status: TransactionStatusEnum.SUCCESS,
            metadata: {
              paymentStatus: data.paymentStatus,
              amountPaid: data.amountPaid,
              totalPayable: data.totalPayable,
              paidOn: data.paidOn,
              paymentDescription: data.paymentDescription,
              settlementAmount: data.settlementAmount,
              customer: data.customer,
            },
          },
        },
        { returnDocument: "after" }
      );
      console.log({ updateTransaction });
      if (updateTransaction == null) {
        throw new AppError("Unable to update transaction");
      }
      const saved = updateTransaction.save();
      console.log({ saved });
      res.status(200).json({
        success: data.paymentStatus === "PAID",
        data: {
          amountPaid: data.amountPaid,
          totalPayable: data.totalPayable,
          paymentStatus: data.paymentStatus,
          paidOn: data.paidOn,
          paymentDescription: data.paymentDescription,
          settlementAmount: data.settlementAmount,
          customer: data.customer,
        },
      });
    } catch (error: any) {
      logger.error(error.message);
      res.json({ error: error.message }).end();
    }
  }

  public async webHook(req: UserRequest, res: Response) {
    try {
      const payload = req.body;
      const signature = req.headers["monnify-signature"] as string;

      // Validate the webhook payload and signature
      const data = await monifyService.webhookHandler(payload, signature);
      if (!data) {
        throw new AppError("Webhook verification failed", 401);
      }
      console.log("data:", data);

      if (data.paymentStatus !== "PAID") {
        throw new AppError("Transaction not paid", 400);
      }

      // Update the transaction in the database

      console.log({ checking: Number(data.amountPaid) - 50 });
      const updateTransaction = await Transaction.findOneAndUpdate(
        { transactionReference: data.transactionReference },
        {
          $set: {
            status: TransactionStatusEnum.SUCCESS,
            type: data.servicePaymentType,
            userEmail: data.customer.email,
            transactionReference: data.transactionReference,
            paymentReference: data.reference,
            amount: data.amountPaid,
            metadata: {
              paymentStatus: data.paymentStatus,
              amountPaid: data.amountPaid,
              settlementAmount_inApp: Number(data.amountPaid) - 50, // General deducted fee by the app
              amountDeducted: 50, // General deducted fee by the app
              totalPayable: data.totalPayable,
              paidOn: data.paidOn,
              paymentDescription: data.paymentDescription,
              settlementAmount: data.settlementAmount,
              customer: data.customer,
            },
          },
        },
        { returnDocument: "after" }
      );

      if (!updateTransaction) {
        throw new AppError("Unable to update transaction", 404);
      }
      const walletOwner = await User.findOne({email:data.customer.email });
      console.log({walletOwner})
      if (!walletOwner){
        throw new AppError("User not found for payment made", 404)
      }

      // Always attempt to fund wallet after successful payment, regardless of servicePaymentType
      
      if (!data.customer?.email) {
        throw new AppError("Customer email missing", 400);
      }

      // Get wallet and verify transaction reference to prevent double payment on a single transaction
      const userWallet = await Wallet.findOne({
        userEmail: data.customer.email,
      });
      if (!userWallet) {
        throw new AppError("User wallet not found", 404);
      }
      if (userWallet.lastTransactionReference === data.transactionReference) {
        throw new AppError("Transaction already processed", 400);
      }

      // Only fund wallet if the transaction is for funding wallet or if you want to fund for all successful payments
      if (data.paymentStatus == "PAID") {
        const update_user_wallet = await walletService.creditWallet(
          walletOwner?._id as string,
          updateTransaction.metadata.settlementAmount_inApp,
          data.transactionReference
        );
        if (update_user_wallet instanceof Error) {
          throw new AppError("Failed to credit wallet", 404);
        }
      }

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error: any) {
      logger.error(error.message);

      if (error instanceof AppError) {
        res.status(error.statusCode || 400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  public async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const transactions = await Transaction.find().populate("user", "-password");
      if(!transactions || transactions instanceof Error){
        throw new AppError("No transactions found", 404);
      }
      res.status(200).json({ success: true, data: transactions });
    } catch (error: any) {
      logger.error("Error fetching transactions:", error.message);
      res.status(error.statusCode).json({ success: false, error: "Internal Server Error" });
    }
  }


public SubscribeToWallet = async (req: UserRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
  res.flushHeaders();

  let watcher: any = null;
const userId: string = req.user.user.id;

// Type the wallet query result
const wallet: IWalletDocument | null = await Wallet.findOne({ user: userId });


  try {
    // Send initial balance immediately when subscribing
    const wallet = await Wallet.findOne({ user: userId });
    if (wallet) {
      res.write(`data: ${JSON.stringify({ balance: wallet.balance })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: "Wallet not found" })}\n\n`);
      return;
    }

    // Watch for changes in this user's wallet - include both insert and update operations
    watcher = Wallet.watch([
      {
        $match: {
          $and: [
            {
              $or: [
                { operationType: "update" },
                { operationType: "replace" },
                { operationType: "insert" }
              ]
            },
            {
              $or: [
                { "fullDocument.user": new mongoose.Types.ObjectId(userId) },
                { "documentKey._id": wallet?._id }
              ]
            }
          ]
        }
      }
    ], { fullDocument: "updateLookup" });

    watcher.on("change", (change: any) => {
      console.log("Wallet change detected:", change);
      
      try {
        // Handle different types of changes
        if (change.operationType === "update" || change.operationType === "replace") {
          // Check if balance was updated
          if (change.updateDescription?.updatedFields?.balance !== undefined) {
            const newBalance = change.updateDescription.updatedFields.balance;
            res.write(`data: ${JSON.stringify({ balance: newBalance })}\n\n`);
          }
          // Also check fullDocument in case of replace operations
          else if (change.fullDocument?.balance !== undefined) {
            res.write(`data: ${JSON.stringify({ balance: change.fullDocument.balance })}\n\n`);
          }
        } else if (change.operationType === "insert" && change.fullDocument) {
          // Handle new wallet creation
          res.write(`data: ${JSON.stringify({ balance: change.fullDocument.balance })}\n\n`);
        }
      } catch (writeError) {
        console.error("Error writing to SSE stream:", writeError);
        // Client likely disconnected
        if (watcher) {
          watcher.close();
        }
      }
    });

    watcher.on("error", (error: any) => {
      console.error("Change stream error:", error);
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      if (watcher) {
        watcher.close();
      }
    });

    // Handle client disconnect
    req.on("close", () => {
      console.log("Client disconnected, closing watcher");
      if (watcher) {
        watcher.close();
      }
    });

    // Handle server shutdown gracefully
    req.on("aborted", () => {
      console.log("Request aborted, closing watcher");
      if (watcher) {
        watcher.close();
      }
    });

  } catch (error) {
    console.error("Error setting up wallet subscription:", error);
    res.write(`data: ${JSON.stringify({ error: "Failed to setup wallet subscription" })}\n\n`);
    if (watcher) {
      watcher.close();
    }
  }
};
public async getUserTransaction (req: UserRequest, res: Response): Promise<void> {
  try {
    const userID = req.user.user.id;
    console.log(userID)
    const getTransactions = await Transaction.find({user: userID})
    if(!getTransactions){
      throw new AppError("No transaction for user", 404)
    }
    res.status(200).json({
      status: "OK",
      data: getTransactions
    })
  } catch (error: any) {
    res.status(error.statusCode).send(error.message)
  }
}
}

export const PaymentContollers = new PaymentController();
