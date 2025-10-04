"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const express_validator_1 = require("express-validator");
// Validation middleware
const validateRequest = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const err = new Error('Validation failed');
        err.name = 'ValidationError';
        err.array = () => errors.array();
        throw err;
    }
    next();
};
exports.validateRequest = validateRequest;
