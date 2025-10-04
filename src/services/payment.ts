import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { MONIFY_CONFIG } from '../config/monify';
import { PaymentDetails, PaymentResponse, TransactionResponse, WalletPayment } from '../utils/types/payment';
import { AppError } from '../utils/HandleErrors';
import { logger } from '../utils/logger';
import { Transaction, TransactionStatusEnum, TransactionType } from '../models/transactions';
import { stringify } from 'querystring';
import Wallet, { IWallet } from '../models/wallet';
import User from '../models/users';
import { Types } from 'mongoose';

export class MonifyService {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly contractCode: string;
  private accessToken: string | null;
  private tokenExpiry: number | null;
  private axiosInstance: AxiosInstance | null;

  constructor() {
    // Validate config at construction time
    if (!MONIFY_CONFIG.baseUrl || !MONIFY_CONFIG.apiKey || 
        !MONIFY_CONFIG.secretKey || !MONIFY_CONFIG.contractCode) {
      throw new AppError('Missing required Monify configuration parameters');
    }

    this.baseUrl = MONIFY_CONFIG.baseUrl;
    this.apiKey = MONIFY_CONFIG.apiKey;
    this.secretKey = MONIFY_CONFIG.secretKey;
    this.contractCode = MONIFY_CONFIG.contractCode;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.axiosInstance = null;
  }

  // private generatePaymentReference(): string {
  //   const timestamp = Date.now();
  //   const random = crypto.randomBytes(4).toString('hex');
  //   return `PAY_${timestamp}_${random}`;
  // }

  private validatePaymentDetails(details: WalletPayment): void {
    if (!details.amount || details.amount <= 0) {
      throw new AppError('Invalid payment amount');
    }
    if (!details.customerEmail || !details.customerName) {
      throw new AppError('Customer details are required');
    }
    if (!details.paymentDescription) {
      throw new AppError('Payment description is required');
    }
  }
 
  async initialize() {
    try {
      logger.info('Initializing Monify API connection...');      
      const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/api/v1/auth/login`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      const { data } = response;
      if (!data?.requestSuccessful || !data?.responseBody?.accessToken) {
        throw new AppError(
          `Authentication failed: ${data?.responseMessage || 'Invalid response format'}`
        );
      }
      
      this.accessToken = data.responseBody.accessToken;
      this.tokenExpiry = Date.now() + ((data.responseBody.expiresIn || 3600) * 1000);

      // Create new axios instance with token
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      logger.info('Successfully initialized Monify API connection');
      
      return true;
    } catch (error: any) {
      logger.error('Monify initialization failed', {
        error: error.message,
        response: error.response?.data
      });
      throw new AppError(
        `Failed to initialize Monify API: ${error.response?.data?.responseMessage || error.message}`
      );
    }
  }

  async ensureValidToken(): Promise<void> {
    const tokenExpired = !this.tokenExpiry || Date.now() >= this.tokenExpiry;
    const tokenMissing = !this.accessToken;

    if (tokenExpired || tokenMissing) {
      await this.initialize();
    }
  }

 async getApiClient(): Promise<AxiosInstance> {
  try {
    await this.ensureValidToken();
    
    if (!this.axiosInstance) {
      // This should not happen after ensureValidToken, but just in case
      logger.error('API client not initialized after token validation');
      throw new AppError('API client not initialized', 500);
    }
    
    return this.axiosInstance;
  } catch (error: any) {
    logger.error('Failed to get API client:', {
      error: error.message,
      hasToken: !!this.accessToken,
      tokenExpiry: this.tokenExpiry,
      hasAxiosInstance: !!this.axiosInstance
    });
    
    // If it's already an AppError, re-throw it
    if (error instanceof AppError) {
      throw error;
    }
    
    // Otherwise, wrap it in an AppError
    throw new AppError(`Failed to get API client: ${error.message}`, 500);
  }
}

  async initiatePayment(details: WalletPayment): Promise<PaymentResponse> {
    try {
      // Validate payment details
      this.validatePaymentDetails(details);
      const client = await this.getApiClient();
console.log(`defaul re: ${MONIFY_CONFIG.defaultRedirectUrl}`)
      const payload:PaymentDetails = {
        amount: details.amount,
        customerName: details.customerName,
        customerEmail: details.customerEmail,
        paymentReference: details.paymentReference,
        paymentDescription: details.paymentDescription,
        contractCode: this.contractCode,
        redirectUrl: MONIFY_CONFIG.defaultRedirectUrl,
        currencyCode: "NGN",
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
        metaData: {
          servicePaidFor: details.metaData?.servicePaidFor,
        } ,
      };
      logger.info('Initiating payment:', { 
        reference: payload.paymentReference,
        amount: payload.amount,
        customer: payload.customerEmail 
      });

      const response = await client.post<PaymentResponse>(
        '/api/v1/merchant/transactions/init-transaction', 
        payload,
      );

      if (!response.data.requestSuccessful) {
        console.log(`${response.data.responseMessage}`)
        throw new AppError(`Payment initiation failed: ${response.data.responseMessage}`);
      }

      logger.info('Payment initiated successfully', {
        reference: payload.paymentReference,
        status: response.data.responseMessage
      });

      return response.data;

    } catch (error: any) {
      logger.error('Payment initiation failed', {
        error: error,
        details: {
          customer: details.customerEmail,
          amount: details.amount
        }
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Payment initiation failed: ${error.response?.data?.responseMessage || error.message}`
      );
    }
  }

  async verifyPayment(paymentReference: string): Promise<TransactionResponse> {
    const encodedReference = encodeURIComponent(paymentReference);
    if (!paymentReference) {
      throw new AppError('Payment reference is required');
    }

    try {
      const client = await this.getApiClient();
      const response = await client.get(
        `/api/v2/transactions/${encodedReference}`
      );

      if (response.data.responseMessage !=='success' ) {
        throw new AppError(
          `Payment verification failed: ${response.data.responseMessage}`
        );
      }

      logger.info('Payment verification successful', {
        reference: paymentReference,
        status: response.data.responseBody?.paymentStatus
      });

      return response.data;

    } catch (error: any) {
      logger.error('Payment verification failed', {
        error: error,
        reference: paymentReference
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        `Payment verification failed: ${error.response?.data?.responseMessage || error.message}`
      );
    }
  }

  /**
   *  Validate Webhook Signature(Monnify)
   * @param signature The signature from the webhook request header
   * @param payload Payload recieved from the webhook request body
   * @returns returns true if the signature is valid, false otherwise
   * @throws AppError if the signature validation fails
   */
  async validateWebhookSignature(signature: string, payload: string): Promise<boolean> {
    if (!signature || !payload) {
      return false;
    }
    
    try {
      const computedSignature = crypto
        .createHmac('sha512', this.secretKey)
        .update(payload)
        .digest('hex');
      return computedSignature == signature;
    } catch (error: any) {
      logger.error('Webhook signature validation failed', {
        error: error.message
      });
      return false;
    }
  }

  public async webhookHandler(payload: any, signature: string): Promise<any> {
    if (!payload || !signature) {
      logger.error('Invalid webhook payload or signature', { payload, signature });
      return "Invalid webhook payload or signature";
    }
    try {
      const trusted = await this.validateWebhookSignature(signature, JSON.stringify(payload));
      if (!trusted) {
        logger.error('Invalid webhook signature', { signature });
        return "Invalid webhook signature";
      }
      console.log({trusted: trusted})
      const eventSet = payload.eventType;
      const data = payload.eventData;
      if (eventSet !== 'SUCCESSFUL_TRANSACTION') {
        logger.info('Transaction unsuccessful', { eventSet });
        return "Transaction unsuccessful";
      }
      if (eventSet === 'SUCCESSFUL_TRANSACTION') {
        const buyLoad =  {
          transactionReference: data.transactionReference,
          reference: data.paymentReference,
          paidOn: data.paidOn,
          amountPaid: data.amountPaid,
          totalPayable: data.totalPayable,
          paymentDescription: data.paymentDescription,
          settlementAmount: data.settlementAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          customer: data.customer,
          cardDetails: data.cardDetails.maskedPan,
          servicePaymentType: data.metaData.servicePaidFor,

        }
        return buyLoad;
      }
      }
    catch (error: any) {
      return error.message;
    }
  }

  public async createWallet_Monnnify(payload: any): Promise<any> {
    try {
      const client = await this.getApiClient();
      const walletData = {
        contractCode: this.contractCode,
        currencyCode: "NGN",
        type: TransactionType.Wallet,
        name: payload.name,
        description: payload.decription,
        customerEmail: payload.email,
        accountReference:"abc1niui23",
        accountName:"Test Reserved Account",
        customerName:"John Doe",
        nin:"21212121212",
        getAllAvailableBanks:true,
  }
      const response = await client.post('/api/v2/bank-transfer/reserved-accounts', walletData);
      if (!response.data.requestSuccessful) {
        throw new AppError(`Wallet creation failed: ${response.data.responseMessage}`);
      }
      return response.data;
    }
    catch (error: any) {
      logger.error('Wallet creation failed', {
        error: error,
        payload: payload
      });
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Wallet creation failed: ${error.response?.data?.responseMessage || error.message}`
      );
    }
}

public async createWallet_InApp(payload: any): Promise<IWallet | any> {
  const generateReference = async () => {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const timestamp = Date.now().toString().slice(-6); // Get last 6 digits of timestamp	
    return `Wallet-${timestamp}-${random}`;
  };
  try {
    const findWallet = await Wallet.findOne({ user: payload._id });
    if (findWallet) {
      return ('Wallet already exists for this user');
    }
    const walletData: IWallet = {
      user: payload._id,
      userEmail: payload.email,
      balance: 0,
      status: 'active',
      currency: 'NGN',
      accountReference: await generateReference(),
      lastTransactionReference: "",
      transactions:Array<Types.ObjectId>(),
      getAllAvailableBanks: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const inApp_walletCreation = await Wallet.create(walletData);
    if (!inApp_walletCreation) {
      return ('In-app wallet creation failed');
    }
    return inApp_walletCreation;
  }
  catch (error: any) {
    logger.error('Wallet creation failed', {});
    if (error instanceof AppError) {
      return error;
    }
}
}


  /**
   * This is used to check payment status of transactions at intervals
   * @param transactionReference The transaction reference to check the payment status for
   * @returns true if the payment is successful, false if failed or pending
   * @throws AppError if the payment status could not be determined
   */
  public checkPaymentStatus = async (transactionReference: string): Promise<boolean> => {
    const client = await this.getApiClient();
    const encodedReference = encodeURIComponent(transactionReference);
    const paymentGatewayApiUrl = `${this.baseUrl}/api/v2/transactions/${encodedReference}`
  // console.log({paymentGatewayApiUrl})
    const maxAttempts = 10; // Set a maximum number of attempts
    let attempts = 0;
  
    while (attempts < maxAttempts) {
      try {
        const response = await client.get(paymentGatewayApiUrl);
        const status = response.data.paymentStatus;
  
        if (status === 'PAID') {
          logger.info("payment successful",{transactionReference: status})
          return true;
        } else if (status === 'failed') {
          return false;
        } else if (status === 'pending') {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        } else {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        }
  
      } catch (error) {
        // Handle the error appropriately, e.g., retry, log, or notify
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
      }
  
      attempts++;
    }
  
    console.log(`Maximum attempts (${maxAttempts}) reached. Payment status could not be determined.`);
    return false; // Or throw an error if you prefer
  }
}

export const monifyService = new MonifyService();