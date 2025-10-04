import { DiscoProviders } from "../../utils/types/DiscoProviders";
import { GSubzAirtimePayload } from "../../utils/types/gsubz_service_Enums";
import axios from "axios";
import { AxiosInstance } from "axios";
class GSubzElectric {
  private apiKey: string = process.env.GSUBZ_AUTH_TOKEN as string;
  private baseURL: string = process.env.GSUBZ_BASE_URL as string;
  private AxiosInstance: AxiosInstance;

  constructor() {
    this.AxiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }
  public async BuyElectricity(
    serviceID: string,
    phone: string,
    customerID: string,
    amount: string,
    variation_code: string
  ) {
    const convertService = DiscoProviders[serviceID as keyof typeof DiscoProviders]
   
    const payload = {
      serviceID: convertService,
      api: this.apiKey,
      phone,
      customerID,
      amount,
      variation_code,
    };
    try {
      const response = await this.AxiosInstance.post("/api/pay/",
        payload,
        {headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!response) {
        throw new Error('response not found for')
      }
      return response.data
    } catch (error: any) {
        throw new Error(error.message || 'error finding electirical service')
    }
  }
}
export const gSubsElectric = new GSubzElectric();