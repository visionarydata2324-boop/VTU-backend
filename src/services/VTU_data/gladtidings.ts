import axios, { AxiosInstance, AxiosResponse } from "axios";
import { GLAD_TIDINGS_CONFIG } from "../../config/gladTidingsConfig";
import {
  DataPayload,
  AIRTEL_PLAN,
  FindDataPayload,
  FindDataRespose,
} from "../../utils/types/gladTidingsPayload";
import { AppError } from "../../utils/HandleErrors";
import { NetworkID } from "../../utils/types/networkID";
import { error } from "console";

export class GladTidingsService {
  private baseUrl: string;
  private authToken: string;
  private axiosInstance: AxiosInstance;
  public findNetworkPlan: (networkProvider: string) => string | undefined;

  constructor() {
    //find the network number identifier
    this.findNetworkPlan = (networkProvider: string): string | undefined => {
      const convertedProvider = networkProvider.toUpperCase()
      console.log("converted Provider: ",convertedProvider)
      for (const network in NetworkID) {
        if (NetworkID[network] == networkProvider) {
          console.log(
            `Network identifier found: ${network} for provider ${networkProvider}`)
          return networkProvider;
        }
      }
      return undefined;
    };
    if (!GLAD_TIDINGS_CONFIG.baseUrl || !GLAD_TIDINGS_CONFIG.authToken) {
      throw new Error("Missing required Glad Tidings base URL or token");
    }
    this.baseUrl = GLAD_TIDINGS_CONFIG.baseUrl;
    this.authToken = GLAD_TIDINGS_CONFIG.authToken;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Token ${this.authToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });
  }

  public initialize = async (): Promise<any> => {
    try {
      const response: AxiosResponse = await this.axiosInstance.get("/user");
      if (!response.data || !response.data.user) {
        throw new Error("Failed to fetch users from Glad Tidings API");
      }
      const dataService = response.data.Dataplans;
      // console.log(dataService)S
      return dataService;
    } catch (error: any) {
      throw new AppError(
        error.message || "Failed to initialize Glad Tidings service"
      );
    }
  };

  // Buy data
  /**
   * Finding Available Data Plan from gladtidings API
   * @param network /
   * @param size
   * @param duration
   * @returns data object or error message
   * @throws AppError if the data plan is not found or unavailable
   */
  public findData = async (
    network: string,
    size: string,
    duration: string
  ): Promise<FindDataRespose | any> => {
    let service;
    let cheapestData;
    try {
      const response = await this.initialize();
      if (!response || !response[network] || !response[network].ALL) {
        throw new Error("Failed to find data plan");
      }

      const networkServices = response[network].ALL;
      // console.log(networkServices)
      const durationNumber = duration.split(" ")[0]; // Gets "30" from "30 days"

      // First filter out null/undefined and ensure properties exist
      const findService = networkServices.filter(
        (service: any) =>
          service &&
          service.month_validate &&
          service.plan &&
          
          service.month_validate.split(" ")[0] == durationNumber &&
          service.plan == size &&
          service.plan_amount &&
          service.plan_amount.substring(0, 6).length <=  6
      );
    // console.log({findService})
      // Check if we found any services
      if (!findService || findService.length === 0) {
        throw new Error("No matching data service found");
      }
      const cleanData = findService.filter(
        (service: any) =>
          !service.month_validate.includes("CURRENTLY UNAVAILABLE")
      );
      
      if (cleanData.length === 0) {
        throw new AppError(
          "No available data plans found for the specified criteria",
          404
        );
      }
      // Find the cheapest data plan
      cheapestData = cleanData.reduce((previous: any, current: any) =>
        parseFloat(previous.plan_amount) < parseFloat(current.plan_amount)
          ? previous
          : current
      );
      //Assign the cheapest
      service = cheapestData;
      // Now we know service exists, so we can safely check its properties
      if (service?.month_validate.includes("CURRENTLY UNAVAILABLE")) {
        throw new Error("Data plan is currently unavailable");
      }
      return service;
    } catch (error: any) {
      return new Error(error.message || "Failed to find data plan");
    }
  };

  public purchaseDataFromMErchant = async (
    payload: DataPayload
  ): Promise<any> => {
    const { network, mobile_number, plan, Ported_number, ident } = payload;
    console.log({ network, mobile_number, plan, Ported_number, ident });

    if (!network || !mobile_number || !plan || !ident) {
      return new AppError("Missing required information to purchase data");
    }

    try {
      const response = await this.axiosInstance.post("/data/", {
        network,
        mobile_number,
        Ported_number,
        plan,
        ident,
      });
      console.log({gtidings:response.data});

      if (response.data.Status !== "successful") {
        return new AppError("Failed to purchase data from merchant");
      }
      if (response instanceof Error) {
        return new AppError(response.message || "Failed to purchase data from merchant");
      }

      return response.data;
    } catch (error: any) {
      return new AppError(
        error.message || "Failed to purchase data from merchant"
      );
    }
  };
}

export const dataService = new GladTidingsService();
