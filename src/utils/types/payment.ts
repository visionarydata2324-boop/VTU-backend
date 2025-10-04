import { Transaction } from '../../models/transactions';
export interface PaymentDetails {
    amount: number;
    paymentCategory?: string;
    customerEmail: string;
    customerName: string;
    paymentReference: string;
    transactionReference?: string;
    paymentDescription: string;
    transactionType?: string | undefined;
    redirectUrl?: string | undefined;
    currencyCode?: string | undefined;
    contractCode?: string | undefined;
    paymentMethods?: string[]
    metaData?: {[key: string]: any} | undefined
    // transactionReference?: string;
    // paymentReference?: string;

  }
  export interface ValidationError {
    field: string;
    message: string;
  }
  export interface InitiatePaymentRequest {
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentDescription?: string;
    redirectUrl?: string;
    paymentReference?: string;
  }

  export interface PaymentResponse {
    requestSuccessful: boolean;
    responseMessage: string;
    responseBody: {
      transactionReference: string;
      paymentReference: string;
      merchantName: string;
      apiKey: string;
      redirectUrl: string;
      transactionHash: string;
    };
  }

  export interface MonifyResponse {
    status: boolean;
    message: string;
    data: {
      paymentReference: string;
      transactionReference: string;
      paymentUrl: string;
    };
  }

  export interface TransactionResponse {
    requestSuccessful: boolean;
    responseMessage: string;
    responseBody: {
      transactionReference: string;
      paymentReference: string;
      paymentStatus: string;
      amountPaid: number;
      totalPayable: number;
      paidOn: string;
      paymentDescription?: string;
      settlementAmount: number;
      customer : {
        email: string;
        name: string
      }
    };
  }

  export interface WalletPayment extends PaymentDetails {
    amount: number;
    customerName: string;
    customerEmail: string;
    paymentReference: string;
    paymentDescription: string;
    metaData?: {[key: string]: any} | undefined; // Make metaData optional with ?
    redirectUrl?: string | undefined; // Make redirectUrl optional if not always needed
    currencyCode?: string | undefined; // Make currencyCode optional if not always needed
    contractCode?: string | undefined; // Make contractCode optional if not always needed
  }