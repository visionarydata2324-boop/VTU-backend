"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const validation_1 = require("../middleware/validation");
const rateLimiter_1 = require("../middleware/rateLimiter");
const authRouter = express_1.default.Router();
// Apply rate limiting to auth routes
authRouter.use(rateLimiter_1.limiter);
authRouter.post('/register', validation_1.validateRequest, authController_1.authController.register);
authRouter.post('/login', validation_1.validateRequest, authController_1.authController.login);
authRouter.post('/verify-email', authController_1.authController.verifyEmail);
authRouter.post('/verify-account', authController_1.authController.verifyAccount);
authRouter.post('/send-verification-email', authController_1.authController.sendVerification);
authRouter.post('/reset-password', authController_1.authController.authenticationToken, authController_1.authController.changePassword);
authRouter.post('/change-pin', authController_1.authController.authenticationToken, authController_1.authController.changePin);
authRouter.get('/get-profile', authController_1.authController.authenticationToken, authController_1.authController.getUserProfile);
authRouter.get('/forgot-password-request', authController_1.authController.resetPasswordRequest);
authRouter.post('/forgot-password', authController_1.authController.forgotPassword);
// authRouter.post('/reset-password/:token', authController.resetPassword);
exports.default = authRouter;
