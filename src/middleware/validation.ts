import { validationResult, ValidationError as ExpressValidatorValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '@/utils/HandleErrors';

// Validation middleware
export  const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err: CustomError = new Error('Validation failed');
    err.name = 'ValidationError';
    err.array = () => errors.array();
    throw err;
  }
  next();
};