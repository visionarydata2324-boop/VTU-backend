"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Price = void 0;
const mongoose_1 = require("mongoose");
const PriceSchema = new mongoose_1.Schema({
    networkProvider: { type: String, required: true },
    bundleType: { type: String, required: true },
    price: { type: Number, required: true },
    setByAdmin: { type: Boolean, default: true },
});
exports.Price = (0, mongoose_1.model)('Price', PriceSchema);
