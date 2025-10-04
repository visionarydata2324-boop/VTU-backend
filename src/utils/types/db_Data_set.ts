import { Types } from 'mongoose';

export interface DBdataSet {
    networkProvider: string;
    sku?: string;
    plan?: string;
    duration?: string;
    price?: number;
    serviceType?: string
    setBy?: string;
}

export interface RequestBody {
    body: {
        userID: string | Types.ObjectId;
        balance: number;
        ledgerBalance: number;
        status: 'active' | 'suspended';
        currency: string; // Optional field for currency
        accountReference: string; // Optional field for account reference
        transactions: Types.ObjectId[];
        getAllAvailableBanks: boolean
        createdAt: Date;
        updatedAt: Date;
    };
}