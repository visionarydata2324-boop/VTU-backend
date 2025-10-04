import { Schema, model, Document, Types } from 'mongoose';
import Wallet from './wallet';

// Define the possible transaction types
export enum TransactionType {
  AIRTIME = 'airtime',
  DATA = 'data',
  ELECTRICITY = 'electricity',
  TV = 'tv',
  Wallet = 'fund_wallet'
}

// Define the possible transaction statuses
export enum TransactionStatusEnum {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed'
}

// Define the metadata interface
export interface TransactionMetadata {
  [key: string]: any;
}

// Define the transaction document interface
export interface ITransaction extends Document {
  user: Types.ObjectId;
  type: TransactionType;
  amount: number;
  status: TransactionStatusEnum;
  paymentReference: string;
  transactionReference: string;
  description: string;
  metadata: TransactionMetadata;
  createdAt: Date;
}

// Create the transaction schema
const transactionSchema = new Schema<ITransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatusEnum),
    default: TransactionStatusEnum.PENDING
  },
  paymentReference: {
    type: String,
    required: [true, 'Payment reference is required'],
  },
  transactionReference: {
    type: String,
    required: [true, 'Transaction reference is required'],
  },
  description: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Add indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ transactionReference: 1 }, { unique: true });
transactionSchema.index({ status: 1 });

// Create and export the model
export const Transaction = model<ITransaction>('Transaction', transactionSchema);