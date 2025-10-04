export enum GSubzServiceEnums {
    MTN_SME = "mtn_sme",
    MTN_SME2 = "mtn_cg_lite",
    MTN_GIFTING = "mtn_gifting",
    MTN_COUPON = "mtn_coupon",
    MTN_CG = "mtncg",
    AIRTEL_CG = "airtel_cg",
    AIRTEL_SME = "airtel_sme",
    GLO_DATA = "glo_data",
    GLO_SME = "glo_sme",
    ETISALAT = "etisalat_data",
}
export enum GSubsAirtimeEnum {
MTN = "mtn",
AIRTEL = "airtel",
GLO = "glo",
ETISALAT = "etisalat"
}

export const groupedServices: Record<string, string[]> = {
  mtn: [
    GSubzServiceEnums.MTN_SME,
    GSubzServiceEnums.MTN_SME2,
    GSubzServiceEnums.MTN_GIFTING,
    GSubzServiceEnums.MTN_COUPON,
    GSubzServiceEnums.MTN_CG,
  ],
  airtel: [
    GSubzServiceEnums.AIRTEL_CG,
    GSubzServiceEnums.AIRTEL_SME,
  ],
  glo: [
    GSubzServiceEnums.GLO_DATA,
    GSubzServiceEnums.GLO_SME,
  ],
  etisalat: [
    GSubzServiceEnums.ETISALAT,
  ],
};


export interface GSubzBuyData {
     serviceID: string,
     plan: number | string,
     api: string ,
     amount: string,
     phone: string,
     request_id: string
}
 export type GsubzDataPlan = {
  displayName: string;
  value: string;
  price: string;
};




export interface GSubzDataPlanResponse {
service: string,
PlanName: null,
fixedPrice: true
plans: GsubzDataPlan[]
}


export interface TransactionMetadata {
  userId: string;
  paymentCategory: string;
  servicePaidFor: string;
  amount: number;
  paymentDescription: string;
  customerName: string;
  transactionReference: string;
}

export interface TransactionObject {
  user: string; // Mongo ObjectId stored as string
  type: string;
  amount: number;
  status: string;
  paymentReference?: string; // optional in case it's null/undefined
  email: string;
  metadata: TransactionMetadata;
}

export interface GSubzAirtimePayload {
  serviceID: string;
  amount: string;
  phone: string;
  api: string;
  // request_id: string;

}
