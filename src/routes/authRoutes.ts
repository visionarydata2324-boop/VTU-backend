import express from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { limiter } from '../middleware/rateLimiter';
import {newUserRoleController} from '../controllers/AdminController/userRole';
import multer from 'multer';



const uploadMulter = multer({ storage: multer.memoryStorage() });

const authRouter = express.Router();

// Apply rate limiting to auth routes
authRouter.use(limiter);

authRouter.get('/hello', authController.hello)
authRouter.post('/register', validateRequest, authController.register );
authRouter.post('/login', validateRequest, authController.login);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post('/verify-account', authController.verifyAccount);
authRouter.post('/resend-otp', authController.sendVerification);
authRouter.post('/reset-password', authController.authenticationToken, authController.changePassword);

authRouter.get('/forgot-password-request', authController.resetPasswordRequest)
authRouter.post('/forgot-password',  authController.forgotPassword);

// authRouter.post('/change-pin',authController.authenticationToken, authController.changePin )
authRouter.get('/get-profile', authController.authenticationToken, authController.getUserProfile);
authRouter.get('/get-users', authController.getUsers)

//Profile Operations
authRouter.get('/get-profile', authController.authenticationToken, authController.getUserProfile);
authRouter.put('/update-profile', authController.authenticationToken, uploadMulter.single('file'), authController.updateProfile);



// authRouter.post('/reset-password/:token', authController.resetPassword);

export default authRouter;