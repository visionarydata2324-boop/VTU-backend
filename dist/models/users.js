"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const validator_1 = __importDefault(require("validator"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const transactions_1 = require("./transactions");
// User Schema
const userSchema = new mongoose_1.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => validator_1.default.isEmail(value),
            message: 'Invalid email format',
        },
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        trim: true,
        validate: {
            validator: (value) => validator_1.default.isMobilePhone(value),
            message: 'Invalid phone number format',
        },
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, // Don't include password in queries by default
    },
    pin: {
        type: String,
        required: [true, 'PIN is required'],
        minlength: [4, 'PIN must be 4 digits'],
        maxlength: [4, 'PIN must be 4 digits'],
        select: false, // Don't include PIN in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'agent', 'admin'],
        default: 'user',
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    transactions: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Transaction'
        }]
}, {
    timestamps: true, // Automatically handle createdAt and updatedAt
    toJSON: {
        transform: (_, ret) => {
            delete ret.password;
            delete ret.pin;
            return ret;
        },
    },
});
// Index for faster queries
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
// Pre-save middleware to hash password and PIN
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') && !this.isModified('pin')) {
        return next();
    }
    try {
        // Hash password if modified
        if (this.isModified('password')) {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.password = await bcryptjs_1.default.hash(this.password, salt);
        }
        // Hash PIN if modified
        if (this.isModified('pin')) {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.pin = await bcryptjs_1.default.hash(this.pin, salt);
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
// Get user's transactions with optional filters
userSchema.methods.getTransactions = async function (filters = {}) {
    return transactions_1.Transaction.find({
        user: this._id,
        ...filters
    }).sort({ createdAt: -1 });
};
//Total spent
userSchema.methods.getTotalSpent = async function () {
    const result = await transactions_1.Transaction.aggregate([
        {
            $match: {
                user: new mongoose_1.default.Types.ObjectId(this._id),
                status: transactions_1.TransactionStatus.SUCCESS
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);
    return result.length > 0 ? result[0].total : 0;
};
// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Instance method to compare PIN
userSchema.methods.comparePin = async function (candidatePin) {
    return bcryptjs_1.default.compare(candidatePin, this.pin);
};
// Instance method to get full name
userSchema.methods.fullName = function () {
    return `${this.firstName} ${this.lastName}`;
};
// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
    return this.findOne({ email: email.toLowerCase() });
};
// Create and export the model
const User = mongoose_1.default.model('User', userSchema);
exports.default = User;
