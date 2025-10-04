"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = require("nodemailer");
const dotenv_1 = require("dotenv");
const logger_1 = require("../utils/logger");
const HandleErrors_1 = require("../utils/HandleErrors");
(0, dotenv_1.configDotenv)();
exports.transporter = (0, nodemailer_1.createTransport)({
    host: process.env.EMAIL_HOST, // Replace with your SMTP server host
    port: 465, // Replace with your SMTP server port (e.g., 587 for TLS, 465 for SSL)
    secure: true, // Use `true` if the port is 465, otherwise `false`
    auth: {
        user: process.env.EMAIL_USER, // Replace with your SMTP username
        pass: process.env.GOOGLE_APP_PASS, // Replace with your SMTP password
    },
});
async function verifyTransporterConnection() {
    try {
        await exports.transporter.verify();
        logger_1.logger.info("Email service connection established");
    }
    catch (error) {
        logger_1.logger.error('Email service connection failed:', error);
        throw new HandleErrors_1.AppError(`Email service connection failed: ${error.message}`, 500);
    }
}
verifyTransporterConnection();
