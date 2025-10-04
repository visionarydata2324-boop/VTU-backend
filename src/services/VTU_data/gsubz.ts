import { logger } from "../../utils/logger";
import {
  GSubzBuyData,
  GSubzServiceEnums,
  GSubzDataPlanResponse,
  GsubzDataPlan,
  groupedServices,
} from "../../utils/types/gsubz_service_Enums";

import axios, { AxiosInstance } from "axios";
// import { AxiosInstance } from 'axios';

export class GsubzService {
  private baseUrl: string;
  private authToken: string;
  private axiosInstance: AxiosInstance;
  constructor() {
    this.baseUrl = process.env.GSUBZ_BASE_URL || "https://api.gsubz.com";
    this.authToken = process.env.GSUBZ_AUTH_TOKEN as string;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  // Get All Services for a Provider
  public getAllServicesFor = (provider: string): string[] => {
    return groupedServices[provider.toLowerCase()] ?? [];
  };

  // Get All Services
  public getAllServicesBYServiceType = async (serviceType: string): Promise<any> => {
    // Get all subservices for a provider (like ['mtn_sme', 'mtn_gifting', ...])
    // const allProviderServices = this.getAllServicesFor(provider);
   try {
     const response = this.axiosInstance.get(`/api/plans?service=${serviceType}`)
      if (!response) {
        throw new Error("Failed to fetch data from Gsubz API");
      }
      const dataService = (await response).data;
      console.log(dataService)
      return dataService.plans;
    } catch (error: any) {

      return new Error(`Failed to fetch services for provider ${serviceType}: ${error.message}`)
      // throw new Error(`Failed to fetch services for provider ${provider}: ${error.message}`);
    }
  };
  //Create Random String for Request ID
  private createRandomString = (): string => {
    const prefix = "GSubz";
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const randString = Math.random().toString(36).substring(2, 7);
    const paddeNum = randomNum.toString().padStart(4, "0");
    return `${prefix}-${randString}-${paddeNum}`;
  };

  
// private convertToMB = (sizeStr: string): number => {
//   const match = sizeStr.match(/([\d.]+)\s*(GB|MB)/i);
//   if (!match) return 0;

//   const value = parseFloat(match[1]);
//   const unit = match[2].toUpperCase();

//   return unit === 'GB' ? value * 1024 : value;
// }


  //Find Network Service Plan
  public findNetworkServicePlan = (
    networkService: string
  ): string | undefined => {
    const services = Object.keys(GSubzServiceEnums).find(
      (Key) => Key === networkService
    );
    if (!services) {
      throw new Error(`Network service ${networkService} not found`);
    }
    return services;
  };

  // Get Gsubz Data by Network Service
  // public getGsubzDataBYNetworkService = async (
  //   plan_category: string
  // ): Promise<GSubzDataPlanResponse> => {
  //   const networkService = this.findNetworkServicePlan(plan_category);
  //   console.log({networkService})
  //   try {
  //     const response = await this.axiosInstance.get(
  //       `/api/plans?service=${networkService}`
  //     )
  //     if (!response.data) {
  //       throw new Error("Failed to fetch data from Gsubz API");
  //     }
  //     const dataService = response.data;
  //     return dataService;
  //   } catch (error: any) {
  //     logger.error(error.message);
  //     return error.message;
  //   }
  // };


private normalize(str: string): string {
  return str.replace(/\s+/g, '');
}

public findOneData = async (
  serviceType: string,
  size: string,
  duration: string,
  networkProvider: string
): Promise<GsubzDataPlan | Error> => {
  try {
    const dataPlans = await this.getAllServicesBYServiceType(serviceType);
    if (!dataPlans) {
      return new Error(`No data plans found for the specified network service`);
    }
    const normalizedPlan = this.normalize(size).toUpperCase();
    const normalizedDuration = this.normalize(duration).toLowerCase();
    
    const matched = dataPlans.find((item: any) => {
      const parts = item.displayName.split('-');
      if (parts.length !== 2) return false;

      const left = this.normalize(parts[0]); // e.g., "300MB"
      const right = this.normalize(parts[1]); // e.g., "2days"

      return left == normalizedPlan && right == normalizedDuration;
    });
   
    if (!matched) {
      throw new Error("No matched data found on Gsubz network");
    }
    return matched;
  } catch (error: any) {
    logger.error("Error finding data:", error.message);
    return error.message;
  }
};



     public buyGsubzDataPlan = async ( {size, phone, value, serviceType}: { size: string, phone: string, value: string, serviceType:string}): Promise<AxiosInstance | any> => {
        try {
            const requestID = this.createRandomString()
          const requestBody: GSubzBuyData = {
              serviceID: serviceType,
              plan: value,
              api: this.authToken,
              amount: "",
              phone: phone,
              request_id: requestID,
          };
          const response = await this.axiosInstance.post(
            `/api/pay/`,
            requestBody, {headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
          );
          if (response.data.code !== 200) {
            throw new Error("Failed to buy data plan");
          }
          if (response instanceof Error) {
            throw new Error(response.message);
          }
          return response.data;
        } catch (error: any) {
          logger.error("Error buying Gsubz data plan:", error.message);
          return  error;
        }
      }
    }
