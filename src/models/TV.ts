import { Schema, model, Document } from 'mongoose';

enum ProviderEnum { 
  DSTV = 'dstv', 
  GOTV = 'gotv', 
  STARTIMES = 'startimes' 
}

interface ICableService {
  provider: ProviderEnum;
  title: string;
  serviceType: string;
  price: number;
  description?: string;
}

// Extend Document for the Mongoose document type
interface ICableServiceDocument extends ICableService, Document {}

const CableTVSchema = new Schema<ICableServiceDocument>({
  provider: {
    type: String,
    required: true,
    enum: Object.values(ProviderEnum) // Validates against enum values
  },
  title: {
    type: String,
    required: true
  },
  serviceType: {
    type: String, 
    required: true,
    unique: true
  },
  price: {
    type: Number,
    required: true,
    min: 0 // Prevents negative prices
  },
  description: {
    type: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

export default model<ICableServiceDocument>('CableTV', CableTVSchema);