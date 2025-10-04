"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const HandleErrors_1 = require("../utils/HandleErrors");
const logger_1 = require("../utils/logger");
const errorCodes_1 = require("../utils/errorCodes");
const nodemailer_1 = require("../config/nodemailer");
const redis_1 = require("../config/redis");
const dotenv_1 = require("dotenv");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
(0, dotenv_1.configDotenv)();
const redis = redis_1.redisClient;
class AuthController {
    constructor() {
        // Register new user
        this.register = async (req, res, next) => {
            try {
                const { firstName, lastName, email, phone, password, pin } = req.body;
                // Check if user exists
                const existingUser = await users_1.default.findOne({
                    $or: [{ email }, { phone }]
                });
                if (existingUser) {
                    if (existingUser.email === email) {
                        throw new HandleErrors_1.AppError('Email already registered', 400, errorCodes_1.ErrorCodes.AUTH_004);
                    }
                    throw new HandleErrors_1.AppError('Phone number already registered', 400, errorCodes_1.ErrorCodes.AUTH_002);
                }
                // Create user
                const user = await users_1.default.create({
                    firstName,
                    lastName,
                    email,
                    phone,
                    password,
                    pin
                });
                // Generate verification token
                const verificationToken = await this.createOTPForEmail(email);
                if (typeof verificationToken !== 'string' || verificationToken.length !== 6) {
                    throw new HandleErrors_1.AppError('Failed to generate verification token', 500, errorCodes_1.ErrorCodes.AUTH_005);
                }
                // TODO: Send verification email
                await this.sendVerificationEmail(email, verificationToken);
                // Generate JWT
                if (user) {
                    const token = this.generateToken(user);
                    // Remove sensitive data
                    const userResponse = {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        isVerified: user.isVerified
                    };
                    logger_1.logger.info(`New user registered: ${email}`);
                    res.status(201).json({
                        status: 'success',
                        message: 'Registration successful. Please verify your email.',
                        token,
                        data: userResponse
                    });
                }
            }
            catch (error) {
                next(error);
            }
        };
        // Login user
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                // Get user with password
                const user = await users_1.default.findOne({ email }).select('+password');
                const oldPass = user?.password;
                if (!user || !(await user.comparePassword(password))) {
                    throw new HandleErrors_1.AppError('Invalid email or password', 401, errorCodes_1.ErrorCodes.AUTH_002);
                }
                // Check if email is verified
                if (!user.isVerified) {
                    throw new HandleErrors_1.AppError('Please verify your email address first', 401, errorCodes_1.ErrorCodes.AUTH_003);
                }
                // Generate token
                const token = this.generateToken(user);
                console.log(token);
                // Remove sensitive data
                const userResponse = {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    isVerified: user.isVerified
                };
                req.user = userResponse;
                logger_1.logger.info(`User logged in: ${email}`);
                res.status(200).json({
                    status: 'success',
                    token,
                    data: userResponse
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Verify email
        this.verifyEmail = async (req, res, next) => {
            try {
                const { submittedOTP, email } = req.body;
                const tokenVerification = await this.verifyOTP(email, submittedOTP);
                if (!tokenVerification) {
                    throw new HandleErrors_1.AppError('Invalid token or email already verified', 400, errorCodes_1.ErrorCodes.AUTH_005);
                }
                const findUser = await users_1.default.findOne({ email });
                if (!findUser) {
                    throw new HandleErrors_1.AppError('User not found', 400, errorCodes_1.ErrorCodes.AUTH_001);
                }
                findUser.isVerified = true;
                findUser.save();
                logger_1.logger.info(`Email verified for user: ${email}`);
                res.status(200).json({
                    status: 'success',
                    isverified: findUser.isVerified,
                    message: 'Email verified successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        //Send verification
        this.sendVerification = async (req, res, next) => {
            try {
                const { email } = req.body;
                const user = await users_1.default.findOne({ email });
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                const verificationToken = await this.createOTPForEmail(email);
                if (typeof verificationToken !== 'string' || verificationToken.length !== 6) {
                    throw new HandleErrors_1.AppError('Failed to generate verification token', 500, errorCodes_1.ErrorCodes.AUTH_005);
                }
                await this.sendVerificationEmail(email, verificationToken, 'Reset token');
                logger_1.logger.info(`Verification email sent to: ${email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Verification email sent successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Resend verification email
        this.verifyAccount = async (req, res, next) => {
            try {
                const { email } = req.body;
                const user = await users_1.default.findOne({ email });
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found. Please register', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                if (user.isVerified) {
                    throw new HandleErrors_1.AppError('Email already verified', 200, errorCodes_1.ErrorCodes.AUTH_004);
                }
                // Generate new verification token
                const verificationToken = await this.createOTPForEmail(email);
                // TODO: Send verification email
                await this.sendVerificationEmail(email, verificationToken);
                logger_1.logger.info(`Verification email resent to: ${email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Verification email sent successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Request password reset
        this.resetPasswordRequest = async (req, res, next) => {
            try {
                const { email } = req.body;
                const user = await users_1.default.findOne({ email }).select('+password');
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                // Generate reset token
                const resetToken = this.generateOTP();
                // TODO: Send reset email
                await this.sendVerificationEmail(email, resetToken, 'Reset token');
                logger_1.logger.info(`Password reset requested for: ${email}`);
                next(resetToken);
            }
            catch (error) {
                next(error);
            }
        };
        // Reset password
        this.resetPassword = async (req, res, next) => {
            try {
                const { password, email } = req.body;
                if (!password || !email) {
                    throw new HandleErrors_1.AppError('Password and email are required', 400, errorCodes_1.ErrorCodes.AUTH_001);
                }
                const salt = await bcryptjs_1.default.genSalt(10);
                const hashedPassword = await bcryptjs_1.default.hash(password, salt);
                // Find user and update password
                const user = await users_1.default.findOneAndUpdate({ email }, { $set: { hashedPassword } }, { new: true });
                if (!user) {
                    throw new HandleErrors_1.AppError('Invalid token or user not found', 400, errorCodes_1.ErrorCodes.AUTH_004);
                }
                await user.save();
                logger_1.logger.info(`Password reset successful for: ${user.email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Password reset successful'
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Get current user
        this.getCurrentUser = async (req, res, next) => {
            try {
                const user = await users_1.default.findById(req.user?.id);
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                res.status(200).json({
                    status: 'success',
                    data: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        isVerified: user.isVerified
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        //Get profile
        this.getUserProfile = async (req, res, next) => {
            try {
                const user = req.user;
                const searchUser = await users_1.default.findById(user?.id);
                if (!searchUser) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                res.status(200).json({
                    status: 'success',
                    data: searchUser
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Update user profile
        this.updateProfile = async (req, res, next) => {
            try {
                const { firstName, lastName, phone } = req.body;
                const user = await users_1.default.findByIdAndUpdate(req.user?.id, { firstName, lastName, phone }, { new: true, runValidators: true });
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                logger_1.logger.info(`Profile updated for user: ${user.email}`);
                res.status(200).json({
                    status: 'success',
                    data: {
                        id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                        isVerified: user.isVerified
                    }
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Change password
        this.changePassword = async (req, res, next) => {
            try {
                const { currentPassword, newPassword } = req.body;
                if (!currentPassword || !newPassword) {
                    throw new HandleErrors_1.AppError('Current password and new password are required', 400, errorCodes_1.ErrorCodes.AUTH_001);
                }
                if (currentPassword === newPassword) {
                    throw new HandleErrors_1.AppError('New password cannot be the same as current password', 400, errorCodes_1.ErrorCodes.AUTH_001);
                }
                const user = await users_1.default.findById(req.user?.id).select('+password');
                if (!user || !(await user.comparePassword(currentPassword))) {
                    throw new HandleErrors_1.AppError('Current password is incorrect', 401, errorCodes_1.ErrorCodes.AUTH_002);
                }
                user.password = newPassword;
                await user.save();
                logger_1.logger.info(`Password changed for user: ${user.email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Password changed successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        // Change PIN
        this.changePin = async (req, res, next) => {
            try {
                const { currentPin, newPin } = req.body;
                const user = await users_1.default.findById(req.user?.id).select('+pin');
                if (!user || !(await user.comparePin(currentPin))) {
                    throw new HandleErrors_1.AppError('Current PIN is incorrect', 401, errorCodes_1.ErrorCodes.AUTH_005);
                }
                user.pin = newPin;
                await user.save();
                logger_1.logger.info(`PIN changed for user: ${user.email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'PIN changed successfully'
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.resetPasswordWithToken = async (req, res, next) => {
            try {
                const { email, submittedOTP, newPassword } = req.body;
                // Verify the reset token (OTP)
                const isTokenValid = await this.verifyOTP(email, submittedOTP);
                if (!isTokenValid) {
                    throw new HandleErrors_1.AppError('Invalid or expired token', 400, errorCodes_1.ErrorCodes.AUTH_005);
                }
                // Find the user
                const user = await users_1.default.findOne({ email });
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                // Hash the new password
                const salt = await bcryptjs_1.default.genSalt(10);
                const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
                // Update the user's password
                user.password = hashedPassword;
                await user.save();
                logger_1.logger.info(`Password reset successful for: ${email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Password reset successful',
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.forgotPassword = async (req, res, next) => {
            try {
                const { resetCode, newPass, confirmPass, email } = req.body;
                if (!resetCode || !newPass || !confirmPass) {
                    throw new HandleErrors_1.AppError("make sure the fields has valid values");
                }
                // Check if the user exists
                const user = await users_1.default.findOne({ email }).select('+password');
                if (!user) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                const verifyToken = this.verifyOTP(email, resetCode);
                if (!verifyToken) {
                    throw new HandleErrors_1.AppError("token not verified or invalid token");
                }
                if (newPass !== confirmPass) {
                    throw new HandleErrors_1.AppError("make sure both fields are the same");
                }
                const new_pass = await user.comparePassword(newPass);
                if (new_pass) {
                    throw new HandleErrors_1.AppError("new password cannot be the same as the old password");
                }
                user.password = newPass;
                const saved = await user.save();
                logger_1.logger.info(`Password reset successful for: ${email}`);
                res.status(200).json({
                    status: 'success',
                    message: 'Password reset successful',
                });
            }
            catch (error) {
                next(error);
            }
        };
        this.isAdmin = async (req, res, next) => {
            try {
                const user = req.user;
                const getUser = await users_1.default.findOne(user?.email);
                if (!getUser) {
                    throw new HandleErrors_1.AppError('User not found', 404, errorCodes_1.ErrorCodes.AUTH_002);
                }
                if (getUser.role !== 'admin') {
                    throw new HandleErrors_1.AppError('Unauthorized. User not admin', 401, errorCodes_1.ErrorCodes.AUTH_006);
                }
                req.user.role = getUser.role;
                next();
            }
            catch (error) {
                res.status(401).json({ error: error.message });
            }
        };
    }
    // Generate JWT Token
    generateToken(user) {
        if (!process.env.JWT_SECRET)
            throw new Error('JWT_SECRET is not defined in environment variables');
        return jsonwebtoken_1.default.sign({ user }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    }
    // Generate Verification Token.
    generateOTP() {
        return Math.floor(100000 + Math.random() * 9000).toString();
    }
    async createOTPForEmail(email) {
        const otp = this.generateOTP();
        // Create Redis key using email
        const key = `otp:${email}`;
        // Store OTP in Redis with 15 minutes expiration
        const setKey = await redis.set(key, otp, 'EX', 15 * 60); // 15 minutes in seconds
        if (setKey !== "OK") {
            throw new HandleErrors_1.AppError('Failed to generate OTP', 500, errorCodes_1.ErrorCodes.AUTH_005);
        }
        const storedOTP = await redis.get(key);
        if (storedOTP !== otp) {
            throw new HandleErrors_1.AppError('Failed to generate OTP', 500, errorCodes_1.ErrorCodes.AUTH_005);
        }
        return storedOTP;
    }
    async verifyOTP(email, submittedOTP) {
        const key = `otp:${email}`;
        // Get stored OTP
        const storedOTP = await redis.get(key);
        // If no OTP found or doesn't match
        if (!storedOTP || storedOTP !== submittedOTP) {
            return false;
        }
        // Delete the OTP from Redis after successful verification
        await redis.del(key);
        return true;
    }
    //Send Verification Email
    async sendVerificationEmail(email, verificationToken, context) {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verification Token",
            text: `${context}: ${verificationToken}`
        };
        try {
            nodemailer_1.transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    throw err;
                }
                logger_1.logger.info('Verification email sent to: ' + info.accepted);
            });
        }
        catch (err) {
            throw new HandleErrors_1.AppError(err.message);
        }
    }
    // Auth header validation and JWT verification
    async authenticationToken(req, res, next) {
        // Extract the Authorization header
        const authHeader = req.headers['authorization'];
        // Check if the Authorization header exists and is in the correct format
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'User not authenticated' });
        }
        // Extract the token from the Authorization header
        const token = authHeader.split(' ')[1]; // "Bearer <token>"
        // Check if the token exists
        if (!token) {
            res.status(401).json({ message: 'User not authenticated' });
        }
        // Verify the JWT
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                res.status(403).json({ message: 'Invalid or expired token' });
            }
            // Attach the decoded user information to the request object
            req.user = user;
            // Proceed to the next middleware or route handler
            next();
        });
    }
}
exports.authController = new AuthController();
