import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import { ITransaction, TransactionStatusEnum, Transaction } from './transactions';
import Wallet from './wallet';

// Interface for the User document
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  image?: string | undefined;
  role: 'user' | 'agent' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Types.ObjectId[] | ITransaction[];
  wallet?: Types.ObjectId | string | typeof Wallet;
 
  // Helper methods
  getTransactions(filters?: Partial<ITransaction>): Promise<ITransaction[]>;
  getTotalSpent(): Promise<number>;
  comparePassword(candidatePassword: string): Promise<boolean>;
  comparePin(candidatePin: string): Promise<boolean>;
  fullName(): string;
}

// Interface for the User model
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// User Schema
const userSchema = new Schema<IUser>(
  {
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
        validator: (value: string) => validator.isEmail(value),
        message: 'Invalid email format',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      validate: {
        validator: (value: string) => validator.isMobilePhone(value),
        message: 'Invalid phone number format',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password in queries by default
    },
    image: {
      type: String,
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
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      select: false
    }],
    wallet: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
    },
  },
  {
    timestamps: true, // Automatically handle createdAt and updatedAt
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        delete ret.pin;
        return ret;
      },
    },
  }
);

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
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    // Hash PIN if modified
    // if (this.isModified('pin')) {
    //   const salt = await bcrypt.genSalt(10);
    //   this.pin = await bcrypt.hash(this.pin, salt);
    // }

    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.pre('findOneAndDelete', async function(next) {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    await mongoose.model('Wallet').deleteOne({ user: user._id });
  }
  next();
});
// Get user's transactions with optional filters
userSchema.methods.getTransactions = async function(
  filters: Partial<Omit<ITransaction, keyof Document>> = {}
): Promise<ITransaction[]> {
  return Transaction.find({
    user: this._id,
    ...filters
  }).sort({ createdAt: -1 });
};

//Total spent
userSchema.methods.getTotalSpent = async function(): Promise<number> {
  const result = await Transaction.aggregate([
    {
      $match: {
        user: this._id,
        status: TransactionStatusEnum.SUCCESS
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
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to compare PIN
userSchema.methods.comparePin = async function (
  candidatePin: string
): Promise<boolean> {
  return bcrypt.compare(candidatePin, this.pin);
};

// Instance method to get full name
userSchema.methods.fullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};


// Create and export the model
const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;