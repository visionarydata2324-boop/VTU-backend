"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePaymentRequest = void 0;
// Custom type guard to check if a value is a number
const isValidNumber = (value) => {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
};
// Email validation helper
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const validatePaymentRequest = (req, res, next) => {
    const errors = [];
    const { amount, customerName, customerEmail, paymentDescription, redirectUrl } = req.body;
    // Validate amount
    if (!amount) {
        errors.push({ field: 'amount', message: 'Amount is required' });
    }
    else if (!isValidNumber(amount)) {
        errors.push({ field: 'amount', message: 'Amount must be a valid number' });
    }
    else if (amount <= 0) {
        errors.push({ field: 'amount', message: 'Amount must be greater than 0' });
    }
    // Validate customerName
    if (!customerName) {
        errors.push({ field: 'customerName', message: 'Customer name is required' });
    }
    else if (typeof customerName !== 'string') {
        errors.push({ field: 'customerName', message: 'Customer name must be a string' });
    }
    else if (customerName.trim().length < 2) {
        errors.push({ field: 'customerName', message: 'Customer name must be at least 2 characters long' });
    }
    // Validate customerEmail
    if (!customerEmail) {
        errors.push({ field: 'customerEmail', message: 'Customer email is required' });
    }
    else if (typeof customerEmail !== 'string') {
        errors.push({ field: 'customerEmail', message: 'Customer email must be a string' });
    }
    else if (!isValidEmail(customerEmail)) {
        errors.push({ field: 'customerEmail', message: 'Invalid email format' });
    }
    // Optional fields validation
    if (paymentDescription !== undefined) {
        if (typeof paymentDescription !== 'string') {
            errors.push({ field: 'paymentDescription', message: 'Payment description must be a string' });
        }
        else if (paymentDescription.trim().length < 3) {
            errors.push({ field: 'paymentDescription', message: 'Payment description must be at least 3 characters long' });
        }
    }
    if (redirectUrl !== undefined) {
        try {
            new URL(redirectUrl);
        }
        catch (error) {
            errors.push({ field: 'redirectUrl', message: 'Invalid redirect URL format' });
        }
    }
    // Return validation errors if any
    if (errors.length > 0) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors
        });
    }
    // Attach validated data to request object
    req.body = {
        amount,
        customerName: customerName.trim(),
        customerEmail: customerEmail.toLowerCase(),
        ...(paymentDescription && { paymentDescription: paymentDescription.trim() }),
        ...(redirectUrl && { redirectUrl })
    };
    next();
};
exports.validatePaymentRequest = validatePaymentRequest;
