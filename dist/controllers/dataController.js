"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCntroller = void 0;
const HandleErrors_1 = require("../utils/HandleErrors");
const gladtidings_1 = require("../services/gladtidings");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class DataCntroller {
    constructor() {
        this.findData = async (req, res, next) => {
            try {
                const { network, plan, duration } = req.body;
                const findData = await gladtidings_1.dataService.findData(network, plan, duration);
                if (findData instanceof Error) {
                    logger_1.logger.error(findData.message);
                    throw new HandleErrors_1.AppError(findData.message);
                }
                if (findData == null || Object.keys(findData).length === 0) {
                    logger_1.logger.error("Data plan not found");
                    throw new HandleErrors_1.AppError("Data plan not found");
                }
                req.data = findData;
                const resposneStatus = findData ? true : false;
                res.json({
                    success: resposneStatus,
                    data: req.data,
                });
            }
            catch (error) {
                logger_1.logger.error({ error: error.message });
                res.json({ error: error.message });
            }
        };
        this.buyData = async (req, res, next) => {
            const generateIdent = async () => {
                const timestamp = Date.now();
                const random = crypto_1.default.randomBytes(4).toString('hex');
                return `Data${timestamp}${random}`;
            };
            //bring in the data from the findData
            const findData = req.data;
            //plan id, phone num, network, plan
            try {
                const { phone, ported } = req.body;
                const newPayload = {
                    network: Number(gladtidings_1.dataService.findNetworkPlan(findData.plan_amount)),
                    mobile_number: phone,
                    plan: Number(findData.dataplan_id),
                    Ported_number: true,
                    ident: await generateIdent()
                };
                const getDataFromApi = await gladtidings_1.dataService.purchaseDataFromMErchant(newPayload);
                if (getDataFromApi instanceof Error) {
                    console.log({ getDataFromApi: getDataFromApi.message });
                    throw new HandleErrors_1.AppError(getDataFromApi.message);
                }
                res.status(200).json({
                    success: true,
                    // data: getDataFromApi,
                });
            }
            catch (error) {
                logger_1.logger.error(error.message);
                res.json(error.message).end();
                next(error);
            }
        };
    }
}
exports.DataCntroller = DataCntroller;
