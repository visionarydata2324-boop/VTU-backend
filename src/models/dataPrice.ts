import { Schema, model, Document } from 'mongoose';

interface IPrice extends Document {
  networkProvider: string;
  bundleType: string;
  price: number;
  setByAdmin: boolean;
}

const PriceSchema = new Schema<IPrice>({
  networkProvider: { type: String, required: true },
  bundleType: { type: String, required: true },
  price: { type: Number, required: true },
  setByAdmin: { type: Boolean, default: true },
});

export const Price = model<IPrice>('Price', PriceSchema);