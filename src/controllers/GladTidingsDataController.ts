
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/HandleErrors";
import { dataService } from "../services/VTU_data/gladtidings";
import { logger } from "../utils/logger";
import { FindDataRespose } from "../utils/types/gladTidingsPayload";
import crypto from "crypto"
import { DataRequest } from '../utils/types/index';
import { walletService } from "../services/inApp_wallet";
import { Data, IData } from "../models/dataPlans";
import { HydratedDocument } from 'mongoose';



type IDataDoc = HydratedDocument<IData>


export class DataCntroller {
private activeService: any; // This will hold the active service instance
    constructor() {    
        //find active service
        this.activeService
        
    }
   

    /**
     * This function finds the Gladtidings data plan based on the network, plan, and duration provided in the request body.
     * It uses the dataService to fetch the data plan and returns it in the response.
     * @param req : DataRequest made to accomodate data payload specifically for gladTidings data plans
     * @param res : Response from  express response
     * @param next: NextFunction to pass the control to the next middleware
     * @returns {Promise<void>} : Returns a promise that resolves to void
     */
    public findData = async (req: DataRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { network, plan, duration } = req.body;
            const dataFound: FindDataRespose | any = await dataService.findData(network, plan, duration);
            if (dataFound instanceof Error){
                logger.error(dataFound.message);
                throw new AppError(dataFound.message)
            }
            if (dataFound == null || Object.keys(dataFound).length === 0){
                logger.error("Data plan not found");
                throw new AppError("Data plan not found")
            }
            req.data = dataFound;
            const resposneStatus = dataFound ? true : false;
            res.json({
                success: resposneStatus,
                data: req.data,
            });
        } catch (error: any) {
            logger.error({error: error.message});
            res.json({error: error.message});
        }
    }

    public buyData = async( req: DataRequest, res: Response, next: NextFunction): Promise<void> => {
        const generateIdent = async () => {
            const timestamp = Date.now();
                const random = crypto.randomBytes(4).toString('hex');
                return `Data${timestamp}${random}`;
        }

        try {
        //Check if user is authenticated}
    
        const user_email = req.user.user.email
        console.log({user_email})
        const { price, networkProvider, plan, duration, mobile_number } = req.body;
        const getPlan: IDataDoc | null = await Data.findOne({ networkProvider, price, duration });

        if (getPlan == null || getPlan.price != price) {
                logger.error("Data plan not found or price mismatch");
                throw new AppError("Data plan not found or price mismatch", 404);
            }

        //Get available data plan from Gladtidings Api
        const dataFound: FindDataRespose = await dataService.findData(networkProvider, plan, duration);
        //Check for irregularities in the data plan
         if (dataFound instanceof Error){
                logger.error(dataFound.message);
                throw new AppError(dataFound.message)
            }
            if (dataFound == null || Object.keys(dataFound).length === 0){
                logger.error("Data plan not found");
                throw new AppError("Data plan not found")
            }

        //use Data plan details to get data from merchant
        
            const newPayload = {
                network: Number(dataService.findNetworkPlan(dataFound.network)),
                mobile_number: mobile_number,
                plan: Number(dataFound.dataplan_id),
                Ported_number: true,
                ident: await generateIdent()
            }
            // console.log({newPayload})

            const getDataFromApi = await dataService.purchaseDataFromMErchant(newPayload);
            if (getDataFromApi instanceof Error){
                console.log({getDataFromApi: getDataFromApi.message})
                throw new AppError(getDataFromApi.message)
            }

            const transactionObject = {
                email: req.user.user.email,
                amount: price,
                transactionData: {
                    userId: req.user.user._id,
                    paymentCategory: "Data",
                    servicePaidFor: "Data Purchase",
                    amount: price,
                    paymentDescription: `Data purchase for ${mobile_number} on ${networkProvider} network`,
                    customerName: req.user.user.name,
                    transactionReference: await generateIdent()
                 }}
            
            const deduct_from_wallet = await walletService.debitWallet(user_email, price,)
            if(deduct_from_wallet instanceof Error){
                logger.error(deduct_from_wallet.message);
                throw new AppError(deduct_from_wallet.message, 500);
            }
            res.status(200).json({
                success: true,
                data: newPayload,
            });
        } catch (error: any) {
            logger.error(error.message);
            res.status(error.statusCode).json(error.message).end();
        }
    }
}