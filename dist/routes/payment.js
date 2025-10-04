"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const authController_1 = require("../controllers/authController");
const paymentRouter = express_1.default.Router();
// paymentRouter.post('/init-payment', PaymentRoute.initiatePayment)
paymentRouter.post('/make-payment', authController_1.authController.authenticationToken, paymentController_1.PaymentRoute.initializePayment);
paymentRouter.post('/verify-payment', authController_1.authController.authenticationToken, paymentController_1.PaymentRoute.verifyTransaction);
// paymentRouter.get('/verify-payment-response', authController.authenticationToken, PaymentRoute.verifyTransaction)
exports.default = paymentRouter;
