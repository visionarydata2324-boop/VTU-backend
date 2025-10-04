"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("../utils/logger");
exports.redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000); // Exponential backoff
        return delay;
    },
});
exports.redisClient.on('connect', () => {
    console.log('Redis is connected successfully');
});
exports.redisClient.on('Ready', () => {
    logger_1.logger.info('Redis client is ready');
});
exports.redisClient.on('error', (err) => {
    logger_1.logger.error('Redis Client Error', err);
});
