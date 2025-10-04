"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.monifyService = exports.MonifyService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const monify_1 = require("../config/monify");
const HandleErrors_1 = require("../utils/HandleErrors");
const logger_1 = require("../utils/logger");
class MonifyService {
    constructor() {
        this.checkPaymentStatus = async (transactionReference) => {
            const client = await this.getApiClient();
            const encodedReference = encodeURIComponent(transactionReference);
            const paymentGatewayApiUrl = `${this.baseUrl}/api/v2/transactions/${encodedReference}`; // Replace with your API URL
            // console.log({paymentGatewayApiUrl})
            const maxAttempts = 10; // Set a maximum number of attempts
            let attempts = 0;
            while (attempts < maxAttempts) {
                try {
                    const response = await client.get(paymentGatewayApiUrl);
                    console.log({ checkRes: response.data });
                    const status = response.data.paymentStatus;
                    if (status === 'PAID') {
                        logger_1.logger.info("payment successful", { transactionReference: status });
                        return true;
                    }
                    else if (status === 'failed') {
                        console.log('Payment failed.');
                        return false;
                    }
                    else if (status === 'pending') {
                        console.log('Payment pending. Checking again in 5 seconds...');
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    }
                    else {
                        console.log(`Unknown status: ${status}. Checking again in 5 seconds...`);
                        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    }
                }
                catch (error) {
                    console.error('Error checking payment status:', error);
                    // Handle the error appropriately, e.g., retry, log, or notify
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
                }
                attempts++;
            }
            console.log(`Maximum attempts (${maxAttempts}) reached. Payment status could not be determined.`);
            return false; // Or throw an error if you prefer
        };
        // Validate config at construction time
        if (!monify_1.MONIFY_CONFIG.baseUrl || !monify_1.MONIFY_CONFIG.apiKey ||
            !monify_1.MONIFY_CONFIG.secretKey || !monify_1.MONIFY_CONFIG.contractCode) {
            throw new HandleErrors_1.AppError('Missing required Monify configuration parameters');
        }
        this.baseUrl = monify_1.MONIFY_CONFIG.baseUrl;
        this.apiKey = monify_1.MONIFY_CONFIG.apiKey;
        this.secretKey = monify_1.MONIFY_CONFIG.secretKey;
        this.contractCode = monify_1.MONIFY_CONFIG.contractCode;
        this.accessToken = null;
        this.tokenExpiry = null;
        this.axiosInstance = null;
    }
    generatePaymentReference() {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(4).toString('hex');
        return `PAY_${timestamp}_${random}`;
    }
    validatePaymentDetails(details) {
        if (!details.amount || details.amount <= 0) {
            throw new HandleErrors_1.AppError('Invalid payment amount');
        }
        if (!details.customerEmail || !details.customerName) {
            throw new HandleErrors_1.AppError('Customer details are required');
        }
        if (!details.paymentDescription) {
            throw new HandleErrors_1.AppError('Payment description is required');
        }
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Monify API connection...');
            const auth = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString('base64');
            const response = await (0, axios_1.default)({
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
                throw new HandleErrors_1.AppError(`Authentication failed: ${data?.responseMessage || 'Invalid response format'}`);
            }
            this.accessToken = data.responseBody.accessToken;
            this.tokenExpiry = Date.now() + ((data.responseBody.expiresIn || 3600) * 1000);
            // Create new axios instance with token
            this.axiosInstance = axios_1.default.create({
                baseURL: this.baseUrl,
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            logger_1.logger.info('Successfully initialized Monify API connection');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Monify initialization failed', {
                error: error.message,
                response: error.response?.data
            });
            throw new HandleErrors_1.AppError(`Failed to initialize Monify API: ${error.response?.data?.responseMessage || error.message}`);
        }
    }
    async ensureValidToken() {
        const tokenExpired = !this.tokenExpiry || Date.now() >= this.tokenExpiry;
        const tokenMissing = !this.accessToken;
        if (tokenExpired || tokenMissing) {
            await this.initialize();
        }
    }
    async getApiClient() {
        await this.ensureValidToken();
        if (!this.axiosInstance) {
            throw new HandleErrors_1.AppError('API client not initialized');
        }
        return this.axiosInstance;
    }
    async initiatePayment(details) {
        try {
            // Validate payment details
            this.validatePaymentDetails(details);
            const client = await this.getApiClient();
            const payload = {
                amount: details.amount,
                customerName: details.customerName,
                customerEmail: details.customerEmail,
                paymentReference: this.generatePaymentReference(),
                paymentDescription: details.paymentDescription,
                contractCode: this.contractCode,
                redirectUrl: monify_1.MONIFY_CONFIG.defaultRedirectUrl,
                currencyCode: "NGN",
                paymentMethods: details.paymentMethods
            };
            logger_1.logger.info('Initiating payment:', {
                reference: payload.paymentReference,
                amount: payload.amount,
                customer: payload.customerEmail
            });
            const response = await client.post('/api/v1/merchant/transactions/init-transaction', payload);
            if (!response.data.requestSuccessful) {
                throw new HandleErrors_1.AppError(`Payment initiation failed: ${response.data.responseMessage}`);
            }
            logger_1.logger.info('Payment initiated successfully', {
                reference: payload.paymentReference,
                status: response.data.responseMessage
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Payment initiation failed', {
                error: error,
                details: {
                    customer: details.customerEmail,
                    amount: details.amount
                }
            });
            if (error instanceof HandleErrors_1.AppError) {
                throw error;
            }
            throw new HandleErrors_1.AppError(`Payment initiation failed: ${error.response?.data?.responseMessage || error.message}`);
        }
    }
    async verifyPayment(paymentReference) {
        const encodedReference = encodeURIComponent(paymentReference);
        if (!paymentReference) {
            throw new HandleErrors_1.AppError('Payment reference is required');
        }
        try {
            const client = await this.getApiClient();
            const response = await client.get(`/api/v2/transactions/${encodedReference}`);
            console.log({ response: response.data.responseMessage });
            if (response.data.responseMessage !== 'success') {
                throw new HandleErrors_1.AppError(`Payment verification failed: ${response.data.responseMessage}`);
            }
            logger_1.logger.info('Payment verification successful', {
                reference: paymentReference,
                status: response.data.responseBody?.paymentStatus
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Payment verification failed', {
                error: error,
                reference: paymentReference
            });
            if (error instanceof HandleErrors_1.AppError) {
                throw error;
            }
            throw new HandleErrors_1.AppError(`Payment verification failed: ${error.response?.data?.responseMessage || error.message}`);
        }
    }
    async validateWebhookSignature(signature, payload) {
        if (!signature || !payload) {
            return false;
        }
        try {
            const computedSignature = crypto_1.default
                .createHmac('sha512', this.secretKey)
                .update(payload)
                .digest('hex');
            return computedSignature === signature;
        }
        catch (error) {
            logger_1.logger.error('Webhook signature validation failed', {
                error: error.message
            });
            return false;
        }
    }
}
exports.MonifyService = MonifyService;
exports.monifyService = new MonifyService();
