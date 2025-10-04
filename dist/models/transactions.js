"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionStatus = exports.TransactionType = void 0;
const mongoose_1 = require("mongoose");
// Define the possible transaction types
var TransactionType;
(function (TransactionType) {
    TransactionType["AIRTIME"] = "airtime";
    TransactionType["DATA"] = "data";
    TransactionType["ELECTRICITY"] = "electricity";
    TransactionType["TV"] = "tv";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
// Define the possible transaction statuses
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["SUCCESS"] = "success";
    TransactionStatus["FAILED"] = "failed";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
// Create the transaction schema
const transactionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(TransactionStatus),
        default: TransactionStatus.PENDING
    },
    paymentReference: {
        type: String,
        required: [true, 'Transaction reference is required'],
    },
    transactionReference: {
        type: String,
        required: [true, 'Transaction reference is required'],
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
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
exports.Transaction = (0, mongoose_1.model)('Transaction', transactionSchema);
