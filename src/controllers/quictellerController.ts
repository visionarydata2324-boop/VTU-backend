import { quickTellerService } from "../services/quickTeller";
import { Request, Response, NextFunction } from "express";


interface PaymentRequest {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    amount: number;
    currency: string;
    customerEmail: string;
    customerName: string;
  }


class QuickTellerController {

    constructor() {}

    async cardPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data: PaymentRequest = req.body;
            // console.log(data)
            const response = await quickTellerService.initiatePayment(data)
            console.log(response)
            if (!response) {
                throw new Error("Payment failed");
            }
            res.status(200).json({
                success: true,
                data: response
            })
        } catch (error: any) {
            res.status(400).json({
                success: false,
                message: error.message
            })
        }
    }
}


export const quickTellerController = new QuickTellerController();