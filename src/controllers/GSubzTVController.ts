import { AppError } from "../utils/HandleErrors";
import { gSubzTvService } from "../services/TV_Services";
import { Request, Response } from "express";
import CableTV from "../models/TV"
import { GsubzTVInterface } from "../utils/types/gSubzTV_types";
import Wallet from "../models/wallet";
import { UserRequest } from '../utils/types/index';
import { Transaction, TransactionStatusEnum, TransactionType } from "../models/transactions";
import { generateReference } from "./GsubzDataController";
import { Types } from "mongoose";
import { authController } from "./authController";

class GSubzCableTVController {
    public async createTVData(req: Request, res: Response): Promise<void> {
        try {
            const { provider, title, serviceType, description, price } = req.body;
            console.log({description})
            const getTV = await CableTV.findOne({ provider, serviceType })
            if(getTV) {
                throw new AppError("Cable service already exist on DB", 409)
            }
            const createTV = await CableTV.create({provider, title, serviceType, description, price})
            if (!createTV){
                throw new AppError("Unable to create TV service", 422)
            }
            res.status(200).json({
                status: 'OK',
                data: createTV
            })
        } catch (error: any) {
            res.status(error.statusCode).send(error.message)
        }
    }
    public async findAllGSubzTVPackage(req: Request, res: Response): Promise<void> {
        try {
               const { provider } = req.body
        // const TV = await gSubzTvService.findTVServices(provider)
        const TV = await CableTV.find({provider})
        if(!TV) {
            throw new AppError("No TV package found for provider", 404)
        }
        res.status(200).json({ [`${provider}_Packages`]: TV })
        }
        catch (error: any) {
            res.status(error.statusCode).send(error.message)
        }
    }

    // public async findOneGsuzTvPackage(req: Request, res: Response) {
    //     const { }
    // }

    public  async deleteOneCableTV(req: Request, res: Response): Promise<void> {
       try {
         const { provider, serviceType } = req.body;
        if(!provider || !serviceType) {
            throw new AppError("Kindly fillin the missing params", 404)
        }
        const TV = await CableTV.findOne({provider, serviceType})
        if (!TV) {
            throw new AppError("No provider found for this service", 404)
        }
        const dlit = await TV.deleteOne();
        if(dlit.acknowledged == true) {
            res.status(200).json({status: "OK", message: "item deleted"})
        }
        else { throw new AppError("Unable to delete item", 500)}
       } catch (error: any) {
        res.status(error.statusCode).send(error.message)
       }
        
    }

    public async editOneInternalCableTV (req:Request, res: Response): Promise<void> {
        try {
            const { provider, title, serviceType, price, description } = req.body;
            const getAllTV = await CableTV.findOneAndUpdate({provider, serviceType}, {
                $set: {
                    title,
                    serviceType,
                    price,
                    description
                }
               
            },  {new: true})
            if(!getAllTV){
                throw new AppError("Unable to update TV service", 404)
            }
            res.status(200).json({
                status: "OK",
                getAllTV
            })

        } catch (error: any) {
            res.status(error.statusCode).send(error.message)
        }
    }

    public async BUYCABLETV(req: UserRequest, res: Response): Promise<void> {
        const userID = req.user.user.id
        try {
            const { provider, serviceType, UIC_smartcard, phone } = req.body;
            console.log({ provider, serviceType, UIC_smartcard });
            if (!provider || !serviceType ) {
                throw new AppError("kindly fill in empty fields", 400);
            }
            const getAvailableInternalTVpackage = await CableTV.findOne({ provider, serviceType });
            if (!getAvailableInternalTVpackage) {
                throw new AppError("Specified service not available", 404);
            }
            const getTVServiceFromGatewayByProvider = await gSubzTvService.findTVServices(provider);
            const listServices = getTVServiceFromGatewayByProvider.list
            const findMatch = listServices.find((item: GsubzTVInterface) => item.value == getAvailableInternalTVpackage.serviceType);
            if(!findMatch){
                throw new AppError(`TV service no found for ${serviceType}. Try again`, 404  )
            }
            const getUserwallet = await Wallet.findOne({user: userID})
            if(!getUserwallet){
                throw new AppError("User wallet not found", 404);
            }
            if(getUserwallet.balance < getAvailableInternalTVpackage.price) {
                throw new AppError("Insuficient balance. Kindly fund your wallet to continue with purchase", 402)
            }
            const buyAvailableServiceFromGateway = await gSubzTvService.buyGsubzCableTV(provider, serviceType, UIC_smartcard, phone)
            if(!buyAvailableServiceFromGateway){
                throw new AppError("Error purchasing tv plan", 409);
            }
            const createTransaction = await Transaction.create({
                    user: req.user.user.id,
                    type: TransactionType.TV,
                    amount: getAvailableInternalTVpackage.price,
                    status:
                      buyAvailableServiceFromGateway.status == 'TRANSACTION_SUCCESSFUL'
                        ? TransactionStatusEnum.SUCCESS
                        : TransactionStatusEnum.FAILED,
                    paymentReference: await generateReference("Electricity"),
                    transactionReference: buyAvailableServiceFromGateway ? buyAvailableServiceFromGateway.content.transactionID.toString() : "",
                    description: `${serviceType} purchase of ${getAvailableInternalTVpackage.price} on ${provider} using ${UIC_smartcard}`,
                    metaData: buyAvailableServiceFromGateway
                  });
            if(buyAvailableServiceFromGateway.status === 'TRANSACTION_SUCCESSFUL') {
                getUserwallet.balance -= getAvailableInternalTVpackage.price;
                getUserwallet.transactions.push(createTransaction._id as Types.ObjectId)
                getUserwallet.save()
                // authController.brevoSendEmail(req.user.user.email, `TV subscription for ${serviceType} is sucessful`)
            }
            res.status(200).json({
                status: "OK",
                data: findMatch,
                details: buyAvailableServiceFromGateway
            });
        } catch (error: any) {
            res.status(error.statusCode || 500).json({ message: error.message || "Internal Server Error" });
        }
    }
}

export const gSubzCableTV = new GSubzCableTVController();