import express from "express";
import { Request, Response, NextFunction } from 'express';
import { SELECTED_CONTROLLER } from "../utils/types/index";
import { DataCntroller as gladTidingsController } from "../controllers/GladTidingsDataController";
import { gsubzDataController } from "../controllers/GsubzDataController";
import { buyGSubzAirtime } from "../controllers/Gsubz_Airtime_Controller";
import { authController } from "../controllers/authController";


const BuyAirtimeRoute = express.Router();

function selectController(req: SELECTED_CONTROLLER, res: Response, next: NextFunction) {
    const serviceType = req.headers['x-service-type'];
    console.log(`header has service: ${req.headers['x-service-type']}`)

    if (serviceType === 'gladtidings') {
        req.selectedController = new gladTidingsController();
    } else if (serviceType === 'gsubz') {
        req.selectedController = gsubzDataController;
    } else {
        res.status(400).json({ error: 'Invalid service type selected.' });
        return
    }

    next();
}

BuyAirtimeRoute.post('/buy-airtime', authController.authenticationToken, buyGSubzAirtime.buyAirtime);

export default BuyAirtimeRoute;