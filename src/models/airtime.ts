import { Schema, model, Document } from "mongoose";

export interface IAirtime extends Document {
  network: string;
  amount: number;
  price: number;
  serviceType: string;
  validity: string; // e.g., "instant", "1 day"
}

const airtimeSchema = new Schema<IAirtime>(
  {
    network: { type: String, required: true },
    amount: { type: Number, required: true }, // e.g. 100, 200, 500, 1000
    price: { type: Number, required: true },  // selling price (may differ from amount)
    serviceType: { type: String, required: true, default: "airtime" },
    validity: { type: String, default: "instant" },
  },
  { timestamps: true }
);

export const Airtime = model<IAirtime>("Airtime", airtimeSchema);
