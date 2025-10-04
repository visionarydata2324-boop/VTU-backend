import express from 'express';
import { authController } from '../../controllers/authController';
import { newUserRoleController } from '../../controllers/AdminController/userRole';
import { PaymentContollers } from '../../controllers/paymentController';


const userAdminRoute = express.Router();
userAdminRoute.post('/update-user', authController.authenticationToken, authController.isAdmin,  newUserRoleController.changeUserRole);
userAdminRoute.get('/all-users', authController.authenticationToken, authController.isAdmin,  newUserRoleController.getAllUsers);
userAdminRoute.get('/all-transactions', authController.authenticationToken, PaymentContollers.getAllTransactions)
export default userAdminRoute;

