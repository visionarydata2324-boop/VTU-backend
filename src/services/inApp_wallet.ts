import { AppError } from "../utils/HandleErrors";
import Wallet, { IWallet } from "../models/wallet" // Assuming you have a Wallet mongoose model
import { ITransaction, Transaction, TransactionStatusEnum } from "../models/transactions";
import { PaymentContollers } from "../controllers/paymentController";
import { TransactionMetadata } from "@/utils/types/gsubz_service_Enums";
import { error } from "console";
import mongoose from "mongoose";

class WalletService {
  
  // Get Wallet
  public async getWallet(userID: string) {
    const wallet = await Wallet.findOne({ user:userID });
    if (!wallet) {
      throw new Error('Wallet not found');
    }
    return wallet;
  }

  // Credit Wallet
  public async creditWallet(userID: string, amount: number, transactionReference?: string) {
    // const session = await mongoose.startSession();
    try {
        // session.startTransaction();

        const wallet = await this.getWallet(userID);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        wallet.balance += amount;
        wallet.updatedAt = new Date();
        wallet.lastTransactionReference = transactionReference

        await wallet.save();     // Save within the transaction
        // await session.commitTransaction();  // Commit the transaction

        return wallet;
    } catch (error) {
      throw new Error("Error crediting wallet: " + (error as Error).message);
        // await session.abortTransaction();   // Rollback on error                     // Re-throw the error
    } finally {
        // session.endSession();               // End the session
    }
  }

  // Debit Wallet
public async debitWallet(
  userID: string,
  amount: number,
): Promise<IWallet | any> {
  try {
    const wallet = await this.getWallet(userID);
console.log(`from debitwalle: ${wallet}`)
  if (!wallet) {
    throw new Error("Couldn't get user wallet");
  }

  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  wallet.balance -= amount;
  wallet.updatedAt = new Date();
  await wallet.save();
  return wallet;
  } catch (error: any) {
    return error.message
  }
}
  



  // Freeze Wallet
public async freezeWallet(email: string): Promise<IWallet | Error> {
  const wallet = await this.getWallet(email);

  if (!wallet) {
    return new Error("Wallet not found for the provided email.");
  }

  if (wallet.status === 'suspended') {
    return new Error("Wallet is already suspended.");
  }

  wallet.status = 'suspended';
  wallet.updatedAt = new Date();

  await wallet.save();
  return wallet;
}


  // Get Wallet Balance
  public async getWalletBalance(email: string) {
   try {
    const wallet = await this.getWallet(email);
    if(!wallet) {
      throw new Error("Wallet not found")
    }
    return {
      balance: wallet.balance,
      currency: wallet.currency || 'NGN',
      status: wallet.status,
    };
   } catch (error: any) {
    if(error instanceof Error) {
      return new Error(error.message)
    }
    return error.message
   }
  }


  //Admin fund user wallet
  public async adminFundUserWallet(walletID: string, amount: number): Promise<IWallet | Error> {
    if(amount <= 0) {
      return new Error("Amount must be greater than zero");
    }
    if (!walletID) {
      return new Error("Please provide a valid wallet ID");
    }
    try {
      const wallet = await Wallet.findOne({_id: String(walletID)});
      if (!wallet) {
        return new Error("Wallet not found for the provided user ID.");
      }

      wallet.balance += amount;
      wallet.updatedAt = new Date();
      await wallet.save();
      return wallet;
    } catch (error: any) {
      return new Error("Error funding wallet: " + error.message);
    }

}
//Admin debit user wallet
public async adminDebitUserWallet(walletID: string, amount: number): Promise<IWallet | Error> {
  if (amount <= 0) {
    return new Error("Amount must be greater than zero");
  }
  if (!walletID) {
    return new Error("Please provide a valid wallet ID");
  }
  try {
    const wallet = await Wallet.findOne({ _id: String(walletID) });
    if (!wallet) {
      return new Error("Wallet not found for the provided user ID.");
    }

    if (wallet.balance < amount) {
      return new Error("Insufficient balance in the wallet");
    }

    wallet.balance -= amount; // subtract instead of add
    wallet.updatedAt = new Date();
    await wallet.save();

    return wallet;
  } catch (error: any) {
    return new Error("Error debiting wallet: " + error.message);
  }
}

}

export const walletService = new WalletService()
