"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoute = void 0;
const HandleErrors_1 = require("../utils/HandleErrors");
const logger_1 = require("../utils/logger");
const redis_1 = require("../config/redis");
const dotenv_1 = require("dotenv");
const payment_1 = require("../services/payment");
const transactions_1 = require("../models/transactions");
const dataPlans_1 = require("../models/dataPlans");
(0, dotenv_1.config)(); // Changed to config() as configDotenv is deprecated
const redis = redis_1.redisClient;
class PaymentController {
    constructor() {
        this.initializePayment = async (req, res, next) => {
            const generateReference = async () => {
                const timestamp = Date.now();
                const random = +1;
                return `PAY${timestamp}-${random}`;
            };
            try {
                console.log(req.user.user);
                const { sku } = req.body;
                const getAmount = await dataPlans_1.Data.find({ sku });
                if (!getAmount) {
                    throw new HandleErrors_1.AppError("Product not identified. Please provide producnt Sku number");
                }
                const details = {
                    amount: getAmount[0].price,
                    customerEmail: req.user.user.email,
                    customerName: `${req.user.user.firstName} ${req.user.user.lastName}`,
                    paymentDescription: req.body.paymentDescription,
                    paymentReference: await generateReference(),
                    contractCode: process.env.MONNIFY_CONTRACT_CODE,
                    currencyCode: "NGN",
                    redirectUrl: process.env.PAYMENT_REDIRECT_URL,
                    paymentMethods: ["CARD", "ACCOUNT_TRANSFER"],
                };
                console.log({ details });
                const payment = await payment_1.monifyService.initiatePayment(details);
                if (!payment) {
                    throw new HandleErrors_1.AppError("Payment initialization failed");
                }
                const createTransaction = await transactions_1.Transaction.create({
                    user: req.user.user._id,
                    type: "data",
                    amount: details.amount,
                    status: transactions_1.TransactionStatus.PENDING,
                    paymentReference: await generateReference(),
                    transactionReference: payment.responseBody.transactionReference,
                    metadata: {
                        paymentDescription: details.paymentDescription,
                        customer: details.customerName,
                        paymentStatus: transactions_1.TransactionStatus.PENDING,
                    },
                });
                await createTransaction.save();
                res.status(200).json({
                    success: true,
                    data: payment,
                });
            }
            catch (error) {
                logger_1.logger.error({ error: error.message });
                res.json({ error: error.message });
                next(error);
            }
        };
    }
    async verifyTransaction(req, res, next) {
        try {
            const { transactionReference } = req.query;
            const reference = transactionReference.toString();
            if (transactionReference[0] !== "M") {
                throw new HandleErrors_1.AppError("Invalid transaction reference");
            }
            const transaction = await payment_1.monifyService.verifyPayment(reference);
            console.log({ transaction });
            if (!transaction?.requestSuccessful) {
                throw new HandleErrors_1.AppError("Transaction not found", 404);
            }
            const data = transaction.responseBody;
            if (data.paymentStatus !== "PAID") {
                throw new HandleErrors_1.AppError("Transaction not paid");
            }
            const updateTransaction = await transactions_1.Transaction.findOneAndUpdate({ transactionReference: data.transactionReference }, { $set: { status: transactions_1.TransactionStatus.SUCCESS, metadata: {
                        paymentStatus: data.paymentStatus,
                        amountPaid: data.amountPaid,
                        totalPayable: data.totalPayable,
                        paidOn: data.paidOn,
                        paymentDescription: data.paymentDescription,
                        settlementAmount: data.settlementAmount,
                        customer: data.customer
                    } } }, { returnDocument: "after" });
            console.log({ updateTransaction });
            if (updateTransaction == null) {
                throw new HandleErrors_1.AppError("Unable to update transaction");
            }
            const saved = updateTransaction.save();
            console.log({ saved });
            res.status(200).json({
                success: data.paymentStatus === "PAID",
                data: {
                    amountPaid: data.amountPaid,
                    totalPayable: data.totalPayable,
                    paymentStatus: data.paymentStatus,
                    paidOn: data.paidOn,
                    paymentDescription: data.paymentDescription,
                    settlementAmount: data.settlementAmount,
                    customer: data.customer,
                },
            });
        }
        catch (error) {
            logger_1.logger.error(error.message);
            res.json({ error: error.message }).end();
        }
    }
}
exports.PaymentRoute = new PaymentController();
