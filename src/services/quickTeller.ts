import { AxiosInstance } from 'axios';
import axios from 'axios';
import { header } from 'express-validator';



interface PaymentRequest {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
  }


class QuicktellerService {
    private  quickTellerToken: string | null;
    private  expires_in: number | null;
    private AxiosInstance: AxiosInstance| null;
    private readonly quicktellerBaseUrl: string


    constructor(){
        this.quicktellerBaseUrl = 'https://qa.interswitchng.com'
        this.quickTellerToken = null;
        this.expires_in = null
        this.AxiosInstance = null

    }
    

    public async handleQuickteller(): Promise<any> {
        const clientId ="IKIA99CA11CBA8351A5DEB04BAB3F046FAAB841D019E"
        const secretKey ="TiHzXr0HXvf7NNU"
        const quickTellerAuthUrl = 'https://passport.k8.isw.la/passport/oauth/token?grant_type=client_credentials';
    
        const auth = Buffer.from(`${clientId}:${secretKey}`).toString('base64'); // converting to base64 string.
        const postReq = await axios({
          url: quickTellerAuthUrl,
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 100000 //optional
        })
        const { data } = postReq;
        console.log({data})
        if (!data?.access_token) {
          throw new Error('Failed to authenticate with Quickteller');
        }

        this.quickTellerToken = data.access_token;
        this.expires_in = Date.now() + ((data?.expires_in || 3600) *10000) // developer discretion is adviced here sir

        this.AxiosInstance = axios.create({
            baseURL: this.quicktellerBaseUrl,
            headers: {
                'Authorization': `Bearer ${this.quickTellerToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 100000 // again optional.
        })
        const newAuth = this.AxiosInstance.defaults.headers.Authorization;
        if (newAuth !== `Bearer ${this.quickTellerToken}`) {
            return new Error('Failed to set Authorization header');
          }

          return newAuth;
    }



public initiatePayment = async (details: PaymentRequest): Promise<any> => {
  console.log({RES: details})
    try {
        const auth = await this.handleQuickteller();
        const headers = {
            'Authorization': auth,
            'Content-Type': 'application/json'
        }
        const response = await axios.post('https://qa.interswitchng.com/paymentgateway/api/v1/paybill', details
        , {headers: headers});
        
        return response.data;
      } catch (error: any) {
        return  new Error(`Failed to initiate payment: ${error.message}`);
      }
}
}

export const quickTellerService = new QuicktellerService();