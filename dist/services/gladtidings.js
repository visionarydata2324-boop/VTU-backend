"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataService = void 0;
const axios_1 = __importDefault(require("axios"));
const gladTidingsConfig_1 = require("../config/gladTidingsConfig");
const HandleErrors_1 = require("../utils/HandleErrors");
const networkID_1 = require("../utils/types/networkID");
class GladTidingsService {
    constructor() {
        this.initialize = async () => {
            try {
                const response = await this.axiosInstance.get('/user');
                if (!response.data || !response.data.user) {
                    throw new Error("Failed to fetch users from Glad Tidings API");
                }
                const dataService = response.data.Dataplans;
                // console.log(dataService)S
                return dataService;
            }
            catch (error) {
                throw new HandleErrors_1.AppError(error.message || "Failed to initialize Glad Tidings service");
            }
        };
        // Buy data
        this.findData = async (network, plan, duration) => {
            let service;
            try {
                const response = await this.initialize();
                if (!response || !response[network] || !response[network].ALL) {
                    throw new Error("Failed to find data plan");
                }
                const networkServices = response[network].ALL;
                const findService = networkServices.filter((service) => service.plan == plan
                    && service.month_validate.substring(0, 2) == duration.substring(0, 2));
                for (let index = 0; index < findService.length; index++) {
                    service = findService[index];
                }
                if (service.month_validate.includes("CURRENTLY UNAVAILABLE")) {
                    throw new Error("Data plan is currently unavailable");
                }
                if (!findService || findService.length === 0) {
                    throw new HandleErrors_1.AppError("No matching data service found");
                }
                return service;
            }
            catch (error) {
                return new Error(error.message || "Failed to find data plan");
            }
        };
        this.purchaseDataFromMErchant = async (payload) => {
            const { network, mobile_number, plan, Ported_number, ident } = payload;
            console.log({ network, mobile_number, plan, Ported_number, ident });
            if (!network || !mobile_number || !plan || !ident) {
                return new HandleErrors_1.AppError("Missing required information to purchase data");
            }
            try {
                const response = await this.axiosInstance.post('/data/', {
                    network,
                    mobile_number,
                    Ported_number,
                    plan,
                    ident
                });
                console.log(response.data);
                if (response.data.success !== "successful") {
                    return new HandleErrors_1.AppError("Failed to purchase data from merchant");
                }
                return response.data;
            }
            catch (error) {
                return new HandleErrors_1.AppError(error.message || "Failed to purchase data from merchant");
            }
        };
        //find the network number identifier
        this.findNetworkPlan = (data) => {
            for (const network in networkID_1.NetworkID) {
                if (networkID_1.NetworkID[network] == data) {
                    return network;
                }
            }
            return undefined;
        };
        if (!gladTidingsConfig_1.GLAD_TIDINGS_CONFIG.baseUrl || !gladTidingsConfig_1.GLAD_TIDINGS_CONFIG.authToken) {
            throw new Error("Missing required Glad Tidings base URL or token");
        }
        this.baseUrl = gladTidingsConfig_1.GLAD_TIDINGS_CONFIG.baseUrl;
        this.authToken = gladTidingsConfig_1.GLAD_TIDINGS_CONFIG.authToken;
        this.axiosInstance = axios_1.default.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Token ${this.authToken}`,
                "Content-Type": "application/json",
            },
            timeout: 10000
        });
    }
}
exports.dataService = new GladTidingsService();
