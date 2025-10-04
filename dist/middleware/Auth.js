"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const users_1 = __importDefault(require("../models/users"));
const redis_1 = require("@/config/redis");
class AuthService {
    static async register(userData) {
        const { firstName, lastName, email, phone, password, pin } = userData;
        // Check if user already exists
        const existingUser = await users_1.default.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            throw new Error('User already exists');
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Hash pin
        const hashedPin = await bcryptjs_1.default.hash(pin, salt);
        // Create user
        const user = new users_1.default({
            firstName,
            lastName,
            phone,
            password: hashedPassword,
            pin: hashedPin
        });
        await user.save();
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, firstName: user.firstName }, process.env.JWT_SECRET || 'just_a_secret', { expiresIn: '1h' });
        return { user, token };
    }
    static async login(email, password) {
        const user = await users_1.default.findOne({ email });
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user._id, firstName: user.firstName }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
        // Store token in Redis for tracking
        await redis_1.redisClient.set(`token:${user._id}`, token, 'EX', 3600);
        return { user, token };
    }
    static async logout(userId) {
        // Remove token from Redis
        await redis_1.redisClient.del(`token:${userId}`);
    }
}
exports.AuthService = AuthService;
