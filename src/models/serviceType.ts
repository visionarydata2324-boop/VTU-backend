import { Schema, model, Document } from 'mongoose';

enum ServiceTypeEnum {
    AIRTIME = 'airtime',
    DATA = 'data',
    ELECTRICITY = 'electricity',
    TV = 'tv',
    WALLET = 'fund_wallet',
}

interface IServiceType extends Document {
    name: ServiceTypeEnum;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceTypeSchema = new Schema<IServiceType>(
    {
        name: { type: String, enum: Object.values(ServiceTypeEnum), required: true, unique: true },
        description: { type: String, required: true },
        isActive: { type: Boolean, default: true },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const ServiceType = model<IServiceType>('ServiceType', ServiceTypeSchema);

export { IServiceType, ServiceType, ServiceTypeEnum };