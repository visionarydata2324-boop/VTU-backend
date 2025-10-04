"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickTellerService = void 0;
const axios_1 = __importDefault(require("axios"));
class QuicktellerService {
    constructor() {
        this.initiatePayment = async (details) => {
            console.log({ RES: details });
            try {
                const auth = await this.handleQuickteller();
                const headers = {
                    'Authorization': auth,
                    'Content-Type': 'application/json'
                };
                const response = await axios_1.default.post('https://qa.interswitchng.com/paymentgateway/api/v1/paybill', details, { headers: headers });
                return response.data;
            }
            catch (error) {
                return new Error(`Failed to initiate payment: ${error.message}`);
            }
        };
        this.quicktellerBaseUrl = 'https://qa.interswitchng.com';
        this.quickTellerToken = null;
        this.expires_in = null;
        this.AxiosInstance = null;
    }
    async handleQuickteller() {
        const clientId = "IKIA99CA11CBA8351A5DEB04BAB3F046FAAB841D019E";
        const secretKey = "TiHzXr0HXvf7NNU";
        const quickTellerAuthUrl = 'https://passport.k8.isw.la/passport/oauth/token?grant_type=client_credentials';
        const auth = Buffer.from(`${clientId}:${secretKey}`).toString('base64'); // converting to base64 string.
        const postReq = await (0, axios_1.default)({
            url: quickTellerAuthUrl,
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 100000 //optional
        });
        const { data } = postReq;
        console.log({ data });
        if (!data?.access_token) {
            throw new Error('Failed to authenticate with Quickteller');
        }
        this.quickTellerToken = data.access_token;
        this.expires_in = Date.now() + ((data?.expires_in || 3600) * 10000); // developer discretion is adviced here sir
        this.AxiosInstance = axios_1.default.create({
            baseURL: this.quicktellerBaseUrl,
            headers: {
                'Authorization': `Bearer ${this.quickTellerToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 100000 // again optional.
        });
        const newAuth = this.AxiosInstance.defaults.headers.Authorization;
        if (newAuth !== `Bearer ${this.quickTellerToken}`) {
            return new Error('Failed to set Authorization header');
        }
        return newAuth;
    }
}
exports.quickTellerService = new QuicktellerService();
