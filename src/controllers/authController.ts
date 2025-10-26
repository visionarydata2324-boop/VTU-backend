import multer from "multer";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/users";
import { AppError } from "../utils/HandleErrors";
import { logger } from "../utils/logger";
import { ErrorCodes } from "../utils/errorCodes";
import { UserRequest } from "../utils/types";
import { configDotenv } from "dotenv";
import { cacheInstance } from "../config/nodeCache";
import bcrypt from "bcryptjs";
import axios from "axios";
import { VerificationData } from "../utils/types/cacheOptions";
import fs from "fs";
import path from "path";
import { monifyService } from "../services/payment";
import Wallet, { IWallet, IWalletDocument } from "../models/wallet";
import { walletController } from "./WalletController";
import { Types } from "mongoose";
import { Transaction } from "../models/transactions";

configDotenv();

interface JwtPayload {
  id: string;
  email: string;
}

interface DataStructure {
  [key: string]: VerificationData; // This allows any string key to map to VerificationData
}

class AuthController {
  // Generate JWT Token
  private generateToken(user: Object): string {
    if (!process.env.JWT_SECRET)
      throw new Error("JWT_SECRET is not defined in environment variables");
    return jwt.sign({ user }, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    });
  }

  public hello = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`Request received from IP: ${ip}`);
    res.status(200).json({
      status: "success",
      message: "Hello, welcome to Ambitious Data Plug API!",
    });
  };

  // Generate Verification Token.
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 9000).toString();
  }

  //Send Verification Email
  // private async sendVerificationEmail (email: string, verificationToken: string, context?: string ): Promise<void> {
  //     const  mailOptions: MailOptions = {
  //         from: "antwanola29@gmail.com",
  //         to: email,
  //         subject: "Verification Token",
  //         text: `${context}: ${verificationToken}`
  //     }
  //       try {
  //         transporter.sendMail(mailOptions, (err, info) => {
  //           if (err) {
  //               throw err
  //           }
  //           logger.info('Verification email sent to: ' + info.accepted)
  //       })
  //       } catch (err: any) {
  //         throw new AppError(err.message)
  //       }
  // }
  /**
   *
   * @param clientEmail  //the email to sent to
   * @param context //the context of the email
   * @param tokent // the token to be sent
   */
  public brevoSendEmail = async (
    clientEmail: string,
    context: string,
    token: string
  ): Promise<void> => {
    const API_KEY = process.env.BREVO_API_KEY as string;
    const BrevoUri = "https://api.brevo.com/v3/smtp/email";

    // Ensure template path works after build
    const htmlTemplate = path.resolve(__dirname,
      "../email_template/email.html"
    );
    const htmlContent = fs.readFileSync(htmlTemplate, "utf8");
    console.log({ BrevoKey: API_KEY });
    // Replace placeholders
    const emailContent = htmlContent
      .replace("{{context}}", context)
      .replace("{{token}}", token);

    const emailData = {
      sender: {
        name: "Ambituox Data Plug",
        email: "visionarydata2324@gmail.com",
      },
      to: [{ email: clientEmail }],
      subject: "Authentication Token",
      htmlContent: emailContent,
    };

    try {
      const sendTask = await axios.post(BrevoUri, emailData, {
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY,
        },
      });
      console.log("✅ Email sent:", sendTask.data);
    } catch (error: any) {
       if (error.code === "ENOENT") {
      throw new AppError("Email template file not found");
    }
      // Handle Axios/API errors
    if (axios.isAxiosError(error)) {
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error ||
        error.message;
      const statusCode = error.response?.status;
         throw new AppError(
        `Failed to send email via Brevo (${statusCode}): ${errorMessage}`
      );
    }
    // Handle any other errors
    throw new AppError(`Failed to send email: ${error.message}`);
    }
  };
  /**
   * Generate a verification token for email
   * @param email - User email
   * @returns The generated token
   */

  public createVerificationOTP = async (email: string): Promise<string> => {
    //generate 6digit token
    const token = this.generateOTP();
    //store in cache for 15 minutes
    cacheInstance.set(
      `verification:${email}`,
      { email, token, expires: Date.now() + 15 * 60 * 1000 },
      Date.now() + 15 * 60 * 1000
    );
    console.log(cacheInstance.get(`verification:${email}`));
    return token;
  };

  /**
   * Verify the token by obtaining the details from cache then verify
   * @param email - The user email
   * @param token - The sent token
   * @returns Boolean indicating if verification was sucessful or not
   */
  public verifyToken = async (
    email: string,
    token: number
  ): Promise<boolean> => {
    const filePath = path.resolve(process.cwd(), "cache.json");
    const cacheKey = `verification:${email}`;

    // Try to get data from cache
    const data = cacheInstance.get<VerificationData>(cacheKey);
    console.log({ data });
    if (data) {
      // Check if the token matches
      if (data?.token !== token) {
        // Use optional chaining to avoid errors
        console.log("Token does not match");
        return false;
      }

      // Check if the token has expired
      if (data?.expires < Date.now()) {
        // Use optional chaining to avoid errors
        console.log("Token expired");
        cacheInstance.delete(cacheKey);
        return false;
      }

      // Delete the cache entry after successful verification
      cacheInstance.delete(cacheKey);
      return true;
    }

    // If data is not in cache, read from file
    console.log("No data in cache, reading from file");
    try {
      const fileData = await fs.promises.readFile(filePath, "utf8");
      const convertedData = JSON.parse(fileData);

      const value = convertedData[cacheKey]?.value; // Use optional chaining to avoid errors

      if (!value) {
        console.log("No value found in file");
        return false;
      }

      // Check if the token matches
      if (value.token !== token) {
        console.log("Token does not match");
        return false;
      }

      // Check if the token has expired
      if (value.expires < Date.now()) {
        console.log("Token expired");
        return false;
      }

      // Delete the cache entry after successful verification
      cacheInstance.delete(cacheKey);
      return true;
    } catch (err: any) {
      throw new AppError(`Error reading file: ${err.message}`);
    }
  };
  /**
   * Register new user
   * @param req - Request from express
   * @param res - Response from express
   * @param next - Nextfunction from express
   */
  public register = async (req: Request, res: Response, next: NextFunction) => {
    const reqBaseURI = `${req.protocol}://${req.get("host")}`;
    const redirectURI = `${reqBaseURI}/api/v1/verify-email`;
    const verification = this.generateOTP();
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Check if user exists
      // TODO: find user
      const existingUser = await User.findOne({
        $or: [{ email }, { phone }],
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new AppError(
            "Email already registered",
            400,
            ErrorCodes.AUTH_004
          );
        }
        throw new AppError(
          "Phone number already registered",
          400,
          ErrorCodes.AUTH_002
        );
      }
      // Generate verification token
      const token = await this.createVerificationOTP(email);

      //Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        phone,
        password,
      });
      if (!user) {
        throw new AppError(
          "User registration failed",
          400,
          ErrorCodes.AUTH_001
        );
      }
      // TODO: Send verification email
      // await this.sendVerificationEmail(email, verificationToken, "User verification Token");
      // console.log(await this.verifyToken(email, token))
      //send token to user email using brevo service
      await this.brevoSendEmail(email, "Verification token", token);

      if (user) {
        if (!user.wallet) {
           const newWallet = await Wallet.create({
          user: user._id,
          userEmail: user.email,
          balance: 0, // default
          status: "active", // default
          currency: "NGN", // or get from req.body if multi-currency
          accountReference: undefined, // can be generated later if needed
          lastTransactionReference: undefined,
          transactions: [],
        });
         if(!newWallet){
          throw new AppError("unable to create waller", 404)
        }
          //push wallet ID to user list and save
        user.wallet = newWallet?._id!
        user.save()
      }
      }
      console.log({userWallet: user})
        //log user registratino
        logger.info(`New user registered: ${email}`);

        res.status(201).json({
          status: "success",
          message: "Registration successful. Please verify your email.",
          redirectURI: redirectURI,
        });
      }catch (error: any) {
      res.status(error.statusCode || 500).json({ error: error.message });
    }
  };

  /**
   * Login Users
   * @param req - Request from express
   * @param res - Response from express
   * @param next - Nextfunction from express
   */
public login = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Get user with password
    const user = await User.findOne({ email }).select("+password");
    const oldPass = user?.password;
    if (!user || !(await user.comparePassword(password as string))) {
      throw new AppError(
        "Invalid email or password",
        401,
        ErrorCodes.AUTH_002
      );
    }

    // Check if email is verified
    if (!user.isVerified) {
      throw new AppError(
        "Please verify your email address first",
        401,
        ErrorCodes.AUTH_003
      );
    }

    // Generate token
    const tokenPayload = {
      id: user._id as string,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    };
    const token = this.generateToken(tokenPayload);
    let addWallet = user.wallet
    if (!addWallet) {
      const createUserWallet = await Wallet.create({
        user: user._id,
        userEmail: user.email,
        balance: 0,
        status: "active",
        accountReference: await walletController.generateReference(),
        lastTransactionReference: null,
        transactions: null,
      });
      if (!createUserWallet) {
        throw new AppError(
          "Could not create user wallet. Kindly retry login",
          409
        );
      }
      user.wallet = createUserWallet._id;
      await user.save();
    }

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
      status: "success",
      token,
      data: addWallet,
    });
  } catch (error: any) {
    // Ensure a default status code is used if error.statusCode is undefined
    const statusCode = error.statusCode || 500; // Default to 500 Internal Server Error
    const message = error.message || "An unexpected error occurred";

    logger.error(`Login error: ${message}`);
    res.status(statusCode).json({ error: message });
  }
};
  /**
   * Auth header validation and JWT verification
   * @param req - Request from express
   * @param res - Response from express
   * @param next - Nextfunction from express
   */
  /**
   * Middleware to authenticate JWT tokens from the Authorization header.
   * Attaches the decoded user to req.user if valid.
   */
  public async authenticationToken(
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let token: string | undefined;  
    try {
      const authHeader = req.headers["authorization"]

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        // Use organization error codes and logging
        logger.warn("Missing or malformed Authorization header");
        throw new AppError(
          "Authorization token missing or malformed",
          401,
          ErrorCodes.AUTH_001
        );
      }

      if(authHeader && authHeader.startsWith("Bearer ")){
        token = authHeader.split(" ")[1];
      }
       


          // Check cookie if no Authorization header
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    // Check query param as a last fallback
    if (!token && req.query?.token) {
      token = req.query.token as string;
    }

      if (!token) {
        logger.warn("Token not found in Authorization header");
        throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_001);
      }

      // Synchronous verification for cleaner async/await flow
      let decodedUser: any;
      try {
        decodedUser = jwt.verify(token, process.env.JWT_SECRET as string);
      } catch (err) {
        logger.warn("Invalid or expired token", { error: err });
        throw new AppError(
          "Invalid or expired token",
          403,
          ErrorCodes.AUTH_001
        );
      }

      req.user = decodedUser;
      next();
    } catch (error: any) {
      // Pass error to Express error handling middleware
      next(error);
    }
  }

  /**
   *   Verify email again when it has expired
   * @param req
   * @param res
   * @param next
   */
  public verifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { submittedOTP, email } = req.body;
      const tokenVerification: boolean = await this.verifyToken(
        email,
        submittedOTP
      );
      console.log({ tokenVerification });

      if (!tokenVerification) {
        throw new AppError(
          "Invalid token or email already verified",
          400,
          ErrorCodes.AUTH_005
        );
      }
      const findUser = await User.findOne({ email });
      if (!findUser) {
        throw new AppError("User not found", 400, ErrorCodes.AUTH_001);
      }
      console.log({ findUser });
      findUser.isVerified = true;
      const wallet = await monifyService.createWallet_InApp(findUser);
      if (!wallet) {
        throw new AppError(
          "Unable to create wallet from verify email controller",
          400,
          ErrorCodes.AUTH_001
        );
      }
      findUser.wallet = wallet._id;
      await findUser.save();

      logger.info(`Email verified for user: ${email}`);

      res.status(200).json({
        status: "success",
        isverified: findUser.isVerified,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  };
  //Send verification for email authentication on reset
  public sendVerification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }
      const verificationToken = await this.createVerificationOTP(email);
      // await this.sendVerificationEmail(email, verificationToken, 'Reset token');
      const sendtask = await this.brevoSendEmail(
        email,
        "Reset Token",
        verificationToken
      );
      logger.info(`Verification email sent to: ${email}`);
      res.status(200).json({
        status: "success",
        message: "Verification email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resend verification email to verify account again
   * @param req
   * @param res
   * @param next
   */
  public verifyAccount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        throw new AppError(
          "User not found. Please register",
          404,
          ErrorCodes.AUTH_002
        );
      }

      if (user.isVerified) {
        throw new AppError("Email already verified", 200, ErrorCodes.AUTH_004);
      }

      // Generate new verification token
      const verificationToken = await this.createVerificationOTP(email);

      // TODO: Send verification email
      // await this.sendVerificationEmail(email, verificationToken);
      const sentTask = await this.brevoSendEmail(
        email,
        "Reset Acount Token",
        verificationToken
      );

      logger.info(`Verification email resent to: ${email}`);

      res.status(200).json({
        status: "success",
        message: "Verification email sent successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Request password reset
  public resetPasswordRequest = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }

      // Generate reset token
      const resetToken = this.generateOTP();

      // TODO: Send reset email
      // await this.sendVerificationEmail(email, resetToken, 'Reset token');
      const sendTask = await this.brevoSendEmail(
        email,
        "Reset Token",
        resetToken
      );

      logger.info(`Password reset requested for: ${email}`);
      next(resetToken);
    } catch (error) {
      next(error);
    }
  };

  // Reset password
  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { password, email } = req.body;
      if (!password || !email) {
        throw new AppError(
          "Password and email are required",
          400,
          ErrorCodes.AUTH_001
        );
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Find user and update password
      const user = await User.findOneAndUpdate(
        { email },
        { $set: { hashedPassword } },
        { new: true }
      );

      if (!user) {
        throw new AppError(
          "Invalid token or user not found",
          400,
          ErrorCodes.AUTH_004
        );
      }
      await user.save();

      logger.info(`Password reset successful for: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Password reset successful",
      });
    } catch (error) {
      next(error);
    }
  };

  // Get current user
  public getCurrentUser = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = await User.findById(req.user?.id);

      if (!user) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }

      res.status(200).json({
        status: "success",
        data: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isVerified: user.isVerified,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  //Get profile
  public getUserProfile = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user.user;
      const searchUser = await User.findById(user.id)
        .populate("wallet")
        .populate("transactions");
      if (!searchUser) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }
      res.status(200).json({
        status: "success",
        data: searchUser,
      });
    } catch (error: any) {
      res.status(error.statusCode).json(error.message);
    }
  };
  // Update profile
// Update profile
public updateProfile = async (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  let imagePath;
  let filename;
  let fileExtension;
  let userDetails = req.user.user;

  try {
    if (!userDetails) {
      throw new AppError("User not authenticated", 401, ErrorCodes.AUTH_001);
    }

    const { firstName, lastName, phone } = req.body;

    // Handle image upload (local storage version)
    if (req.file) {
      fileExtension = path.extname(req.file.originalname);
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new AppError("Only JPG, PNG, and WebP images are allowed", 400);
      }

      // Ensure uploads directory exists
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
      }

      filename = `profile-${userDetails?.firstName}-${Date.now()}${fileExtension}`;
      const filepath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize(300, 300)
        .jpeg({ quality: 70 })
        .toFile(filepath);

      imagePath = `/uploads/${filename}`;
    }

    const user = await User.findByEmail(userDetails?.email);
    if (!user) {
      throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
    }

    // ✅ Duplicate phone check
    if (phone && phone !== user.phone) {
      const existingPhoneUser = await User.findOne({ phone });
      if (existingPhoneUser) {
        throw new AppError(
          "Phone number already in use",
          400
        );
      }
    }

    // Delete old image if exists
    if (user.image && imagePath) {
      const baseName = path.basename(user.image);
      const oldImagePath = path.join(__dirname, "../../uploads", baseName);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: userDetails.email },
      { firstName, lastName, phone, image: imagePath || user.image },
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

  // Change password
  public changePassword = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        throw new AppError(
          "Current password and new password are required",
          400,
          ErrorCodes.AUTH_001
        );
      }
      if (currentPassword === newPassword) {
        throw new AppError(
          "New password cannot be the same as current password",
          400,
          ErrorCodes.AUTH_001
        );
      }

      const user = await User.findById(req.user?.id).select("+password");

      if (!user || !(await user.comparePassword(currentPassword))) {
        throw new AppError(
          "Current password is incorrect",
          401,
          ErrorCodes.AUTH_002
        );
      }
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);

      res.status(200).json({
        status: "success",
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // Change PIN
  // public changePin = async (req: UserRequest, res: Response, next: NextFunction) => {
  //   try {
  //     const { currentPin, newPin } = req.body;

  //     const user = await User.findById(req.user?.id).select('+pin');

  //     if (!user || !(await user.comparePin(currentPin))) {
  //       throw new AppError('Current PIN is incorrect', 401, ErrorCodes.AUTH_005);
  //     }

  //     user.pin = newPin;
  //     await user.save();

  //     logger.info(`PIN changed for user: ${user.email}`);

  //     res.status(200).json({
  //       status: 'success',
  //       message: 'PIN changed successfully'
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  //   public resetPasswordWithToken = async (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const { email, submittedOTP, newPassword } = req.body;

  //     // Verify the reset token (OTP)
  //     const isTokenValid = await this.verifyOTP(email, submittedOTP);

  //     if (!isTokenValid) {
  //       throw new AppError('Invalid or expired token', 400, ErrorCodes.AUTH_005);
  //     }

  //     // Find the user
  //     const user = await User.findOne({ email });

  //     if (!user) {
  //       throw new AppError('User not found', 404, ErrorCodes.AUTH_002);
  //     }

  //     // Hash the new password
  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(newPassword, salt);

  //     // Update the user's password
  //     user.password = hashedPassword;
  //     await user.save();

  //     logger.info(`Password reset successful for: ${email}`);

  //     res.status(200).json({
  //       status: 'success',
  //       message: 'Password reset successful',
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
  public forgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { resetCode, newPass, confirmPass, email } = req.body;

      if (!resetCode || !newPass || !confirmPass || !email) {
        throw new AppError("make sure the fields has valid values");
      }

      // Verify the reset token (OTP)
      const isTokenValid = await this.verifyToken(email, resetCode);
      if (!isTokenValid) {
        throw new AppError(
          "Invalid or expired token",
          400,
          ErrorCodes.AUTH_005
        );
      }

      // Check if the user exists
      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }

      if (newPass !== confirmPass) {
        throw new AppError("make sure both fields are the same");
      }

      const new_pass = await user.comparePassword(newPass);
      if (new_pass) {
        throw new AppError(
          "new password cannot be the same as the old password"
        );
      }
      user.password = newPass;
      const saved = await user.save();
      logger.info(`Password reset successful for: ${email}`);
      res.status(200).json({
        status: "success",
        message: "Password reset successful",
      });
    } catch (error: any) {
      res.json(error.message);
    }
  };

  public isAdmin = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const user = req.user.user;
      const getUser = await User.findOne({email: user.email});
      if (!getUser) {
        throw new AppError("User not found", 404, ErrorCodes.AUTH_002);
      }

      if (getUser.role !== "admin") {
        throw new AppError(
          "Unauthorized. User not admin",
          401,
          ErrorCodes.AUTH_006
        );
      }
      req.user.role = getUser.role;
      next();
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
  public getUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await User.find();
      if (!user) {
        throw new AppError("couldn't find user");
      }
      res.json(user);
    } catch (error: any) {
      res.json(error.message);
    }
  };
  public getLoggedInUser = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user.user;
      const getUser = await User.findById(user._id)
        .populate("wallet")
        .populate("transactions");
      if (!getUser) {
        throw new AppError("couldn't find user");
      }
      res.json(getUser);
    } catch (error: any) {
      res.json(error.message);
    }
  };

  public async getUserTransactions(req: UserRequest, res: Response): Promise<void> {
    try {
      const userID = req.user.user.id;
    console.log(userID)
    if(!userID) {
      throw new AppError("Invalid or expired user token. Kindly sing in to view", 404)
    }
    const getTransactions = await Transaction.findOne({})
    } catch (error) {
      
    }

  }
}

export const authController = new AuthController();
