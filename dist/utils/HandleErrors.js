"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.globalErrorHandler = exports.AppError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("../utils/logger");
// Custom error classes for more specific error handling
class AppError extends Error {
    constructor(message, statusCode = 500, ErrorCodes) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.ErrorCodes = ErrorCodes;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const globalErrorHandler = (err, req, res, next) => {
    // Default error object
    let error = {
        status: 'error',
        statusCode: 500,
        message: 'Internal Server Error'
    };
    // Log the error
    logger_1.logger.error(`[Global Error Handler] ${err.message}`, {
        error: err,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });
    // Handle specific error types
    if (err instanceof AppError) {
        // Custom application errors
        error.statusCode = err.statusCode;
        error.message = err.message;
    }
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
        // Mongoose validation errors
        error.statusCode = 400;
        error.message = 'Invalid data';
        error.errors = Object.values(err.errors).map(e => e.message);
    }
    else if (err.name === 'ValidationError' && err.array) {
        // Express-validator errors
        const validationErrors = err.array();
        error.statusCode = 422;
        error.message = 'Validation failed';
        error.errors = validationErrors;
    }
    else if (err.name === 'UnauthorizedError') {
        // JWT authentication errors
        error.statusCode = 401;
        error.message = 'Unauthorized';
    }
    else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        // MongoDB specific errors
        if (err.code === 11000) {
            error.statusCode = 409;
            error.message = 'Duplicate key error';
        }
    }
    // In development, include full stack trace
    if (process.env.NODE_ENV === 'development') {
        console.log({ errorCheck: process.env.NODE_ENV });
        error.stack = err.stack;
    }
    // Process-level exception handlers
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught Exception:', {
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            },
            timestamp: new Date().toISOString()
        });
        // Gracefully shutdown the server
        console.error('Uncaught Exception! Shutting down...');
        process.exit(1);
    });
    process.on('unhandledRejection', (reason) => {
        logger_1.logger.error('Unhandled Rejection:', {
            error: {
                name: reason?.name,
                message: reason?.message,
                stack: reason?.stack
            },
            timestamp: new Date().toISOString()
        });
        // Gracefully shutdown the server
        console.error('Unhandled Rejection! Shutting down...');
        process.exit(1);
    });
    // Send error response
    res.status(error.statusCode).json({
        status: error.status,
        message: error.message,
        ...(error.errors && { errors: error.errors }),
        ...(error.stack && { stack: error.stack })
    });
};
exports.globalErrorHandler = globalErrorHandler;
// Async error wrapper to reduce try-catch boilerplate
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
exports.catchAsync = catchAsync;
