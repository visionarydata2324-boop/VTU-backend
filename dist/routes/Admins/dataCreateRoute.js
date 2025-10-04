"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminDataController_1 = require("../../controllers/AdminController/adminDataController");
const authController_1 = require("../../controllers/authController");
const dataRoute = express_1.default.Router();
// Set price for a specific network provider and bundle type (admin only)
dataRoute.post('/create-data', authController_1.authController.authenticationToken, authController_1.authController.isAdmin, adminDataController_1.newDataPrice.createData);
dataRoute.put('/update-data', authController_1.authController.authenticationToken, authController_1.authController.isAdmin, adminDataController_1.newDataPrice.updateData);
dataRoute.post('/post-data/:networkProvider', authController_1.authController.authenticationToken, authController_1.authController.isAdmin, adminDataController_1.newDataPrice.getNetworkData);
dataRoute.get('/get-all-data', authController_1.authController.authenticationToken, authController_1.authController.isAdmin, adminDataController_1.newDataPrice.allData);
exports.default = dataRoute;
