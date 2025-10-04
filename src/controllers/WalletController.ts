import { AppError } from "../utils/HandleErrors";
import Wallet, { IWallet, IWalletDocument } from "../models/wallet";
import { Request, Response } from "express";
import { walletService } from "../services/inApp_wallet";
import { UserRequest } from "../utils/types/index";
import { monifyService } from "../services/payment";
import User from "../models/users";
import { Transaction } from "../models/transactions";
import { TransactionType, TransactionStatusEnum } from '../models/transactions';


class WalletController {
  constructor() {}

  public generateReference = async () => {
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp
    return `Wallet-${timestamp}-${random}`;
  };
  //create wallet at will
  public createWallet = async (userID: string): Promise<IWallet | Error> => {
    try {
      const walletPayload = {
        user: userID,
        balance: 0,
        status: "active",
        currency: "NGN",
        accountReference: await this.generateReference(),
      };
      const wallet = await Wallet.create(walletPayload);
      if (!wallet) {
        throw new AppError("Wallet not created", 404);
      }
      console.log({ walletCreation: wallet });
      return wallet;
    } catch (error: any) {
      return error.message as Error;
    }
  };
  //get wallet by userId
  public getWallet = async (req: UserRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.user._id;
      const wallet = await walletService.getWallet(userId);
      if (wallet instanceof Error) {
        throw new AppError(
          "Failed to retrieve wallet for the given user ID",
          404
        );
      }
      res.json(wallet);
    } catch (error: any) {
      res.json(error.message);
    }
  };
  /**
   * Creadit wallet used to fund user wallet when user is signed in.
   * @param req The Custom user request objectcontaining user information extending request data
   * @param res Express response object
   * @return {Promise<void>} A promise that resolves to void
   * @throws {AppError} If there is an error during the process, an AppError is thrown with a message and status code.
   */
  public FundWallet = async (
    req: UserRequest,
    res: Response
  ): Promise<void> => {
    let user = null;
    let createWall: IWallet | Error;
    try {
      const userId = req.user.user.id;
      console.log(userId);
      const { amount } = req.body;
      const paymentPayload = {
        amount,
        customerName: req.user.user.name,
        customerEmail: req.user.user.email,
        paymentReference: "",
        paymentDescription: "Wallet funding",
      };
      const getUserWallet = await Wallet.findOne({ userId });
      if (userId && !getUserWallet) {
        createWall = await this.createWallet(userId);
        if (createWall instanceof Error) {
          throw new AppError(
            createWall.message || "Unable to create wallet for user",
            402
          );
        }

        user = await User.findOne({ userId });
        if (user) {
          user.wallet = createWall?._id;
          user.save();
        }
      }

      res.status(200).json({
        success: true,
        data: "testing",
        message:
          "Payment initiated successfully, please complete the payment to fund your wallet",
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  //Admin fund user wallet
  public adminFundUserWalletController = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { userEmail, amount, description } = req.body;
    try {
      if (!userEmail || !amount) {
        throw new AppError("Please provide both userEmail and amount", 400);
      }
      const getUserToFund = await User.findOne({ email: userEmail });
      if (!getUserToFund) {
        throw new AppError("User not found", 404);
      }

       const convertedNum = Number(amount)
      if(isNaN(convertedNum)) {
        throw new AppError("Amount must be a valid number", 400)
      }

      const fundUserWallet = await walletService.adminFundUserWallet(
        getUserToFund.wallet as string,
        convertedNum
      );
      if (fundUserWallet instanceof Error) {
        throw new AppError(
          fundUserWallet.message || "Unable to fund user wallet",
          400
        );
      }

       const createTransaction = await Transaction.create({
            user: getUserToFund._id,
            paymentCategory: "Fund wallet",
            type: TransactionType.Wallet,
            amount: amount,
            status: TransactionStatusEnum.SUCCESS,
            paymentReference: "Admin Fund wallet", // Use same reference
            transactionReference: await this.generateReference(),
            metadata: {
              paymentDescription: description || "Admin funded user wallet",
              customer: getUserToFund,
              paymentStatus: TransactionStatusEnum.SUCCESS,
            },
          });
      res.status(200).json({
        status: "success",
        data: fundUserWallet,
        message: `Successfully funded ${getUserToFund.lastName}'s wallet`,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  };


  //Admin debit user wallet
  public adminDebitUserWalletController = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { userEmail, amount, description } = req.body;

    try {
      if (!userEmail || !amount) {
        throw new AppError("Please provide both userEmail and amount", 400);
      }

      const getUserToDebit = await User.findOne({ email: userEmail });
      if (!getUserToDebit) {
        throw new AppError("User not found", 404);
      }
      const convertedNum = Number(amount)
      if(isNaN(convertedNum)) {
        throw new AppError("Amount must be a valid number", 400)
      }

      const debitUserWallet = await walletService.adminDebitUserWallet(
        getUserToDebit.wallet as string,
        convertedNum
      );

      if (debitUserWallet instanceof Error) {
        throw new AppError(
          debitUserWallet.message || "Unable to debit user wallet",
          400
        );
      }

       const createTransaction = await Transaction.create({
            user: getUserToDebit._id,
            paymentCategory: "Debit wallet",
            type: TransactionType.Wallet,
            amount: amount,
            status: TransactionStatusEnum.SUCCESS,
            paymentReference: "Admin debit wallet", // Use same reference
            transactionReference: await this.generateReference(),
            metadata: {
              paymentDescription: description || "Admin debited user wallet",
              customer: getUserToDebit,
              paymentStatus: TransactionStatusEnum.SUCCESS,
            },
          });
      res.status(200).json({
        status: "success",
        data: debitUserWallet,
        message: `Successfully debited ${getUserToDebit.lastName}'s wallet`,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  };

  //Get user wallet balance
  public getUserWalletBalance = async (
    req: UserRequest,
    res: Response
  ):Promise<void> => {
    const { user } = req.user;
    try {
      if (!user) { 
        throw new AppError("User not found", 404);
      }
      console.log(user);
      const walletBalance = await walletService.getWalletBalance(user.id);
      if(!walletBalance || walletBalance instanceof Error) {
        throw new AppError("Unable to get wallet balance", 400)
      }
      res.status(200).json({
        status: "success",
        data: walletBalance,
      });
    } catch (error: any) {
      if(error instanceof AppError ) {
      res.status(error.statusCode).json({ error: error.message });
    }
    res.send(error.message)
}
}
}

export const walletController = new WalletController();
