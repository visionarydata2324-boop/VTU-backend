import mongoose, { Document, Schema, Types } from "mongoose";
import { ITransaction } from "./transactions";
import { IUser } from "./users";

// -------------------------------------
// Wallet Interface
// -------------------------------------
export interface IWallet {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  userEmail: string;
  balance: number;
  status: "active" | "suspended";
  currency: string;
  accountReference?: string;
  lastTransactionReference?: string;
  transactions: Types.ObjectId[];
  getAllAvailableBanks?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// -------------------------------------
// Mongoose Document Interface
// -------------------------------------
export interface IWalletDocument extends IWallet, Document<Types.ObjectId> {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// -------------------------------------
// Wallet Schema
// -------------------------------------
const walletSchema = new Schema<IWalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
      required: true,
    },
    accountReference: {
      type: String,
    },
    lastTransactionReference: {
      type: String,
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    getAllAvailableBanks: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// -------------------------------------
// Indexes
// -------------------------------------
walletSchema.index({ user: 1 }, { unique: true });
walletSchema.index({ userEmail: 1 }, { unique: true });
walletSchema.index({ status: 1 });

// -------------------------------------
// Model
// -------------------------------------
const Wallet = mongoose.model<IWalletDocument>("Wallet", walletSchema);

// -------------------------------------
// Populated Wallet Type
// -------------------------------------
export interface PopulatedWallet
  extends Omit<IWallet, "user" | "transactions"> {
  user: IUser;
  transactions: ITransaction[];
}

export default Wallet;
