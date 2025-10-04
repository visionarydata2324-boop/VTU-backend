"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const database_1 = require("./config/database");
const HandleErrors_1 = require("./utils/HandleErrors"); // Import the global error handler
const logger_1 = require("./utils/logger"); // Ensure you have the logger imported
const corsOptions_1 = require("./config/corsOptions");
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const redis_1 = require("./config/redis");
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// cors
app.use((0, cors_1.default)(corsOptions_1.corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Initialize the connection
const initializeRedis = async () => {
    try {
        redis_1.redisClient.on('connect', () => {
            logger_1.logger.info('Redis client connected successfully');
        });
        redis_1.redisClient.on('ready', () => {
            logger_1.logger.info('Redis client is ready to use');
        });
        redis_1.redisClient.on('error', (err) => {
            logger_1.logger.error('Redis Client Error', err);
        });
        // Optional: Test connection
        const testKey = 'redis:init';
        await redis_1.redisClient.set(testKey, 'initialized');
        const value = await redis_1.redisClient.get(testKey);
        logger_1.logger.info(`Redis test key "${testKey}" has value: ${value}`);
    }
    catch (err) {
        logger_1.logger.error('Error during Redis initialization', err);
    }
};
initializeRedis();
// Middleware
app.use(express_1.default.json()); // Add JSON body parser
app.use(express_1.default.urlencoded({ extended: true })); // Add URL-encoded body parser
// Rate limiting
app.use(rateLimiter_1.limiter);
// Connect to MongoDB
(0, database_1.connectDB)();
// const  initQuick = async () => {
//  quickTellerService.handleQuickteller()
// }
// initQuick()
// const seed = async () => {
//   await seedData()
// }
// const initializeGladTidings = async () => {
//   await dataService.initialize()
//   await dataService.findData("AIRTEL_PLAN", "1.0GB", "30 days")
// }
// initializeGladTidings()
//use routes
app.use("/", routes_1.default);
// 404 handler (place before global error handler)
app.use((req, res, next) => {
    next(new HandleErrors_1.AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
// Global error handler (must be the last middleware)
app.use(HandleErrors_1.globalErrorHandler);
// Unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Graceful shutdown
});
// Uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught Exception:', error);
    //Graceful shutdown
    process.exit(1);
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger_1.logger.info(`Server is running on port ${PORT}`);
});
exports.default = app;
