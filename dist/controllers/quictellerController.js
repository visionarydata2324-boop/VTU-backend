"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickTellerController = void 0;
const quickTeller_1 = require("../services/quickTeller");
class QuickTellerController {
    constructor() { }
    async cardPayment(req, res, next) {
        try {
            const data = req.body;
            // console.log(data)
            const response = await quickTeller_1.quickTellerService.initiatePayment(data);
            console.log(response);
            if (!response) {
                throw new Error("Payment failed");
            }
            res.status(200).json({
                success: true,
                data: response
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}
exports.quickTellerController = new QuickTellerController();
