"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const winston_1 = __importDefault(require("winston"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.configDotenv)();
const logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.File({ filename: 'error.log', level: 'error' }),
        new winston_1.default.transports.File({ filename: 'combined.log' })
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.simple()
    }));
}
const connectDB = async () => {
    try {
        if (process.env.NODE_ENV == 'development') {
            await mongoose_1.default.connect(process.env.DEV_URI);
        }
        await mongoose_1.default.connect(process.env.DEV_URI);
        logger.info(`MongoDB Connected using ${process.env.NODE_ENV}`);
    }
    catch (error) {
        logger.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
