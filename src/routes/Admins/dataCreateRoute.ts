import express from 'express';
import { newDataPrice } from '../../controllers/AdminController/adminDataController';
import { authController } from '../../controllers/authController';
import { serviceController } from '../../controllers/AdminController/serviceTypeController';

const dataRoute = express.Router();

// Create data for sale (admin only)
dataRoute.post('/create-data', authController.authenticationToken, authController.isAdmin, newDataPrice.createData );
//Update created data (admin only)
dataRoute.put('/update-data', authController.authenticationToken, authController.isAdmin, newDataPrice.updateData );
// Get all data by network Provider (admin only)
dataRoute.get('/get-data/:networkProvider', authController.authenticationToken, newDataPrice.getNetworkData );
//Get all data (admin only)
dataRoute.get('/get-all-data',  newDataPrice.allData)
//Delete data by sku (admin only)
dataRoute.delete('/delete-data/:sku', authController.authenticationToken, authController.isAdmin, newDataPrice.deleteData );

// Create category for different services (admin only) lazy way to do this but just flow along
dataRoute.post("/create-category", authController.authenticationToken, authController.isAdmin,serviceController.createService);
//Get all created categories (admin only)
dataRoute.get("/get-category", authController.authenticationToken, authController.isAdmin,serviceController.getAllServices);



export default dataRoute;