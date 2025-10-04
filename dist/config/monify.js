"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONIFY_CONFIG = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.MONIFY_CONFIG = {
    baseUrl: process.env.MONNIFY_BASE_URL,
    apiKey: process.env.MONNIFY_API_KEY,
    secretKey: process.env.MONNIFY_SECRET_KEY,
    contractCode: process.env.MONNIFY_CONTRACT_CODE,
    defaultRedirectUrl: process.env.MONIFY_DEFAULT_REDIRECT,
    enabledPaymentMethod: [
        "ACCOUNT_TRANSFER",
        "CARD"
    ],
};
