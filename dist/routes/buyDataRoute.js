"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dataController_1 = require("../controllers/dataController");
const authController_1 = require("../controllers/authController");
const dataContollerRoute = express_1.default.Router();
const dataCntroller = new dataController_1.DataCntroller();
dataContollerRoute.post('/buy-data', authController_1.authController.authenticationToken, dataCntroller.buyData);
dataContollerRoute.post('/find-data', authController_1.authController.authenticationToken, dataCntroller.findData);
exports.default = dataContollerRoute;
