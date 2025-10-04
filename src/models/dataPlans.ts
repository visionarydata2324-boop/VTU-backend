import { Schema, model,Types,  Document } from 'mongoose';


export interface IData extends Document {
  // sku: string,
  networkProvider: string;
  size?: string;
  duration?: string;
  price?: number;
  serviceType?: string;
  setBy?: string;
  createdAt?: Date;
}

const DataSchema = new Schema<IData>({
  networkProvider: { type: String, required: true },
  // sku: { type: String, require: true },
  size: { type: String },
  duration: { type: String },
  price: { type: String },
  serviceType: { type: String },
  createdAt: { type: Date, default: Date.now },
  setBy: { type: String, default: 'admin' },
});

DataSchema.pre('save', function (next) {
  if (!this.createdAt) {
    this.createdAt = new Date();
  }
  next();
});

export const Data = model<IData>('Data', DataSchema);