import { Request, Response, NextFunction } from "express";
import { gSubzAirtime } from "../services/airtime/Gsubz_airtime";
import { AppError } from "../utils/HandleErrors";
import { logger } from "../utils/logger";
import { UserRequest } from "../utils/types/index";
import { walletService } from "../services/inApp_wallet";
import {
  ITransaction,
  Transaction,
  TransactionStatusEnum,
  TransactionType,
} from "../models/transactions";
import { Types } from "mongoose";
import { generateReference } from "./GsubzDataController";

class BuyGSubzAirtime {
  private numToString = (num: number | string): string => {
    return num.toString();
  };
  async buyAirtime(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { network, amount, phone } = req.body;

      // Input validation
      if (!network || !amount || !phone) {
        throw new AppError("Missing required fields", 400);
      }

      // Additional validation
      if (amount <= 0) {
        throw new AppError("Amount must be greater than 0", 400);
      }

      const wallet = await walletService.getWallet(req.user.user.id);
      if (wallet.balance < amount) {
        throw new AppError("Insufficient balance", 400);
      }

      // console.log({ wallet });

      // Purchase airtime
      const response = await gSubzAirtime.purchaseAirtime(
        phone,
        amount,
        network
      );
console.log(response)
      if (response.status !== "successful") {
        throw new AppError(response.description || "Airtime purchase failed", 400);
      }

      // Update wallet and create transaction record
      const newBalance = wallet.balance - amount;
      wallet.balance = newBalance;

      const newTransaction: ITransaction = await Transaction.create({
        user: req.user.user.id,
        type: TransactionType.AIRTIME,
        amount: amount,
        status:
          response.status == "successful"
            ? TransactionStatusEnum.SUCCESS
            : TransactionStatusEnum.FAILED,
        paymentReference: await generateReference("Airtime"),
        transactionReference: response.transactionID.toString(),
        description: `Airtime purchase of ${amount} on ${network} to ${phone}`,
        metaData: response,
      });

      wallet.transactions.push(newTransaction._id as Types.ObjectId);
      await wallet.save();

      res.status(200).json({
        message: "Airtime purchase successful",
        data: {
          newBalance: newBalance,
          response: response,
        },
      });
    } catch (error: any) {
      logger.error("Airtime purchase error:", error);
      res
        .status(error.statusCode || 500)
        .json({ error: error.message || "Internal Server Error" });
    }
  }
}

export const buyGSubzAirtime = new BuyGSubzAirtime();
