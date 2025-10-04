import express from 'express';
import {PaymentContollers} from '../controllers/paymentController';
import { authController } from '../controllers/authController';
import { walletController } from '../controllers/WalletController';
import cors from 'cors';



const paymentRouter = express.Router();

// paymentRouter.post('/init-payment', PaymentRoute.initiatePayment)
paymentRouter.post('/make-payment',authController.authenticationToken, PaymentContollers.initializePayment)
paymentRouter.post('/verify-payment', authController.authenticationToken, PaymentContollers.verifyTransaction)
paymentRouter.post('/webhook', cors(), PaymentContollers.webHook)
paymentRouter.post('/fund-wallet',cors(), authController.authenticationToken, PaymentContollers.initializePayment)
paymentRouter.post('/admin-fund-wallet', authController.authenticationToken, authController.isAdmin, walletController.adminFundUserWalletController)
paymentRouter.post('/admin-debit-wallet', authController.authenticationToken, authController.isAdmin, walletController.adminDebitUserWalletController)
paymentRouter.get('/wallet-balance', authController.authenticationToken, walletController.getUserWalletBalance)
paymentRouter.get('/wallet-balance/subscribe', authController.authenticationToken, PaymentContollers.SubscribeToWallet )
paymentRouter.get('/user-transactions', authController.authenticationToken, PaymentContollers.getUserTransaction)



export default paymentRouter;