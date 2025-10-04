"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
exports.corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600, // 10 minutes
    exposedHeaders: ['Authorization', 'Content-Type']
};
