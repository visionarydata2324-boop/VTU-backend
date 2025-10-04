import { authController } from "../controllers/authController";
import { gsubzElectricController } from "../controllers/GSubz_Electric";
import express, { Express } from "express";

const ElectricRouter = express.Router()



ElectricRouter.post('/buy-electricity', authController.authenticationToken, gsubzElectricController.BuyGsubzElectric);

export default ElectricRouter