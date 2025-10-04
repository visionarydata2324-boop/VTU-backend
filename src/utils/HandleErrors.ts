// src/middleware/global-error-handler.ts
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Custom error classes for more specific error handling
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  ErrorCodes?: string;

  constructor(message: string, statusCode: number = 500, ErrorCodes?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.ErrorCodes = ErrorCodes

    Error.captureStackTrace(this, this.constructor);
  }
}

// Comprehensive error interface
export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: number;
  errors?: any[];
  array?: () => any[]; // Added for validation errors
}

// Error response interface
interface ErrorResponse {
  status: 'error' | 'fail';
  statusCode: number;
  message: string;
  errors?: any[];
  stack?: string;
}

export const globalErrorHandler = (
  err: CustomError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default error object
  let error: ErrorResponse = {
    status: 'error',
    statusCode: 500,
    message: 'Internal Server Error'
  };

  // Log the error
  logger.error(`[Global Error Handler] ${err.message}`, {
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
  } else if (err instanceof mongoose.Error.ValidationError) {
    // Mongoose validation errors
    error.statusCode = 400;
    error.message = 'Invalid data';
    error.errors = Object.values(err.errors).map(e => e.message);
  } else if (err.name === 'ValidationError' && err.array) {
    // Express-validator errors
    const validationErrors = err.array();
    error.statusCode = 422;
    error.message = 'Validation failed';
    error.errors = validationErrors;
  } else if (err.name === 'UnauthorizedError') {
    // JWT authentication errors
    error.statusCode = 401;
    error.message = 'Unauthorized';
  } else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    // MongoDB specific errors
    if (err.code === 11000) {
      error.statusCode = 409;
      error.message = 'Duplicate key error';
    }
  }

  // In development, include full stack trace
  if (process.env.NODE_ENV === 'development') {
    console.log({errorCheck: process.env.NODE_ENV})
    error.stack = err.stack;
  }

  // Send error response
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(error.stack && { stack: error.stack })
  });
};

// Async error wrapper to reduce try-catch boilerplate
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void | Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// MOVE THESE OUTSIDE - Process-level exception handlers (call once at app startup)
export const setupProcessHandlers = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
    
    console.error('Uncaught Exception! Shutting down...');
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection:', {
      error: reason instanceof Error ? {
        name: reason.name,
        message: reason.message,
        stack: reason.stack
      } : {
        message: String(reason),
        type: typeof reason
      },
      promise: promise.toString(),
      timestamp: new Date().toISOString()
    });
    
    console.error('Unhandled Rejection! Shutting down...');
    process.exit(1);
  });
};