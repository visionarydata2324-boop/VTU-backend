declare module 'monnify-nodejs' {
  export class Monnify {
      constructor(config: {
          apiKey: string;
          secretKey: string;
          baseUrl?: string;
      });

      initializeTransaction(paymentDetails: any): Promise<any>;
      getTransactionStatus(paymentReference: string): Promise<any>;
      validateTransaction(transactionReference: string): Promise<any>;
      getBanks(): Promise<any>;
  }

  export default Monnify;
}