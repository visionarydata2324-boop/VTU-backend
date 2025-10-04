"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Data = void 0;
const mongoose_1 = require("mongoose");
const DataSchema = new mongoose_1.Schema({
    networkProvider: { type: String, required: true },
    sku: { type: String, require: true },
    plan: { type: String },
    duration: { type: String },
    price: { type: Number },
    setBy: { type: String, required: true },
});
exports.Data = (0, mongoose_1.model)('Data', DataSchema);
