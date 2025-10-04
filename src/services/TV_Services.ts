import axios, { AxiosInstance } from "axios";


class GSubzTVService {
      private apiKey: string = process.env.GSUBZ_AUTH_TOKEN as string;
      private baseURL: string = process.env.GSUBZ_BASE_URL as string;
      private AxiosInstance: AxiosInstance;

      constructor() {
        this.AxiosInstance = axios.create({
            baseURL: this.baseURL,
            headers: {
                Authorization: `Bearer ${this.apiKey}`, 
                "Content-Type": "application/json"
            }
        })
      }

      public async findTVServices(provider: string): Promise<any> {
        try {
          if (!provider){
            throw new Error("serviceID not available for requested service")
          }
          const findService = await this.AxiosInstance.post(`/api/plans?service=${provider}`);
          return findService.data
        } catch (error: any) {
          throw error;
        }
      }

    public async buyGsubzCableTV(serviceID: string, serviceType: string, UIC_Smart_card: string, phone: string): Promise<any> {
      if (!serviceType || !UIC_Smart_card || !phone) {
        throw new Error("Kindly input the necessary fields");
      }
    
      try {
        const UserPayload = {
          serviceID: serviceID,
          api_key: this.apiKey,
          variation_code: serviceType,
          phone,
          amount: "",
          customerID: UIC_Smart_card
        };
          console.log({from: UserPayload.serviceID})
        const response = await this.AxiosInstance.post('/api/pay/', UserPayload, { headers: { "Content-Type": "application/json" } });
        if (response.data.status !== 'TRANSACTION_SUCCESSFUL') {
          throw new Error(response.data.description || "Unable to buy TV service");
        }
        return response.data;
      } catch (error: any) {
        throw new Error(error.message);
      }
    }
}

export const gSubzTvService = new GSubzTVService()