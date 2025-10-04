import { GSubzAirtimePayload } from '../../utils/types/gsubz_service_Enums';
import axios from 'axios';
import { AxiosInstance } from 'axios';
class GSubzAirtime {
private apiKey: string = process.env.GSUBZ_AUTH_TOKEN as string;
private baseURL: string = process.env.GSUBZ_BASE_URL as string;
private AxiosInstance: AxiosInstance;

    constructor() {
        this.AxiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
    }
public generateRequestId(): string {
  return Date.now().toString().slice(-6); // last 6 digits of timestamp
}
    public createUniqueID () {
        return "Airtime" + this.generateRequestId()
    }

    public async verifyTransaction(requestID: string): Promise<any> {
      console.log(this.apiKey)
      const payload = {
        api: this.apiKey,
        requestID
      }
    try {
      const response = await this.AxiosInstance.post('/api/verify', {
        payload,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log("Verification response:", response.data);

      // Example: normalize the status
      if (response.data.status === 'TRANSACTION_SUCCESSFUL') {
        return { success: true, data: response.data };
      } else {
        return { success: false, data: response.data };
      }
    } catch (error: any) {
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
    public async purchaseAirtime(
    phone: string,
    amount: string,
    serviceID: string
  ): Promise<any> {
    const convertServiceID = serviceID.toLowerCase();
    const requestID = Date.now().toString(); // unique per request (you can also use uuid)

    const payload = {
      phone,
      amount,
      serviceID: convertServiceID,
      requestID,
      api: this.apiKey
    };

    try {
      const response = await this.AxiosInstance.post('/api/pay/', payload, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      console.log("Initial airtime response:", response.data);
       return response.data;
    } catch (error: any) {
      console.warn("Purchase request error:", error.message);
    }

    // Always verify to be sure
    // return this.verifyTransaction(requestID);
  }
}
export const gSubzAirtime = new GSubzAirtime()