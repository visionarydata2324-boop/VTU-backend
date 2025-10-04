"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newDataPrice = void 0;
const dataPlans_1 = require("../../models/dataPlans");
const HandleErrors_1 = require("../../utils/HandleErrors");
const logger_1 = require("../../utils/logger");
class DataPrice {
    constructor() {
        this.createData = async (req, res, next) => {
            let num = 100;
            const ID = () => {
                return `SKU_${num++}`;
            };
            try {
                const { networkProvider, plan, price, duration } = req.body;
                const who = req.user.role;
                // Check if the data plan exists
                const data = await dataPlans_1.Data.findOne({ networkProvider, plan });
                if (data !== null) {
                    throw new HandleErrors_1.AppError('Data plan already exists', 400);
                }
                // Create a new data
                const newData = new dataPlans_1.Data({ networkProvider, plan, price, duration, setBy: who, sku: ID() });
                const saved = await newData.save();
                if (!saved) {
                    throw new HandleErrors_1.AppError("New data not created");
                }
                res.status(201).json(newData);
            }
            catch (error) {
                logger_1.logger.error({ error: error.message });
                res.json({ error: error.message });
            }
        };
        // Update price for a specific network provider and bundle type (admin only)
        this.updateData = async (req, res, next) => {
            let num = 100;
            const ID = () => {
                return `SKU_${++num}`;
            };
            try {
                const { networkProvider, plan, price, duration } = req.body;
                const update = {
                    networkProvider,
                    sku: ID(),
                    plan,
                    price,
                    duration,
                    setBy: req.user.role
                };
                // Find and update the price
                const updateData = await dataPlans_1.Data.findOneAndUpdate({ networkProvider, plan }, { $set: update }, { new: true });
                if (!updateData) {
                    throw new HandleErrors_1.AppError('Data plan not found. Please create one', 404);
                }
                const updateSatus = updateData ? true : false;
                res.status(200).json({ status: updateSatus, updateData });
            }
            catch (error) {
                logger_1.logger.error({ error: error.message });
                res.json({ error: error.message });
            }
        };
        // Get all prices for a specific network provider
        this.getNetworkData = async (req, res) => {
            try {
                const { networkProvider } = req.params;
                console.log(networkProvider);
                const data = await dataPlans_1.Data.find({ networkProvider });
                if (!data) {
                    throw new HandleErrors_1.AppError("Data not found", 404);
                }
                res.json(data);
            }
            catch (error) {
                res.status(404).json(error.message);
            }
        };
        //Get all data
        this.allData = async (req, res, next) => {
            try {
                const data = await dataPlans_1.Data.find();
                if (!data) {
                    throw new HandleErrors_1.AppError("ata not found", 404);
                }
                res.json(data);
            }
            catch (error) {
                res.json(error.message);
            }
        };
    }
}
exports.newDataPrice = new DataPrice();
