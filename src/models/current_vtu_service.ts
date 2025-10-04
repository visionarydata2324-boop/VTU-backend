import { Schema, model,Types,  Document } from 'mongoose';
import mongoose from 'mongoose';



export interface ISetting extends Document {
  key: string;
  value: string;
  updated_at: Date;
}

// Define the schema for the settings
//The key is either GSubz or GladTidings
const SettingSchema =  new Schema<ISetting>({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    updated_at: { type: Date, default: Date.now }
})

export const Setting = mongoose.model<ISetting>('Settings', SettingSchema);
