"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GLAD_TIDINGS_CONFIG = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
exports.GLAD_TIDINGS_CONFIG = {
    baseUrl: process.env.GLAD_TIDINGS_BASE_URL,
    authToken: process.env.GLAD_TIDINGS_AUTH_TOKEN,
};
