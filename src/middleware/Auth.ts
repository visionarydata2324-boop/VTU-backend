import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/users';
import { IUser } from '../models/users';
import { redisClient } from '@/config/nodeCache';



export class AuthService {
  static async register(userData: IUser) {
    const { firstName, lastName, email, phone, password, pin } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Hash pin
    const hashedPin = await bcrypt.hash(pin, salt);

    // Create user
    const user = new User({
      firstName,
      lastName,
      phone,
      password: hashedPassword,
      pin: hashedPin
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, firstName: user.firstName }, 
      process.env.JWT_SECRET || 'just_a_secret',
      { expiresIn: '1h' }
    );

    return { user, token };
  }
  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, firstName: user.firstName },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '1h' }
    );

    // Store token in Redis for tracking
    await redisClient.set(`token:${user._id}`, token, 'EX', 3600);

    return { user, token };
  }

  static async logout(userId: string) {
    // Remove token from Redis
    await redisClient.del(`token:${userId}`);
  }
}