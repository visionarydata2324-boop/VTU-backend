"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const quictellerController_1 = require("../controllers/quictellerController");
const quickTellerRouter = express_1.default.Router();
quickTellerRouter.post("/card-payment", quictellerController_1.quickTellerController.cardPayment);
exports.default = quickTellerRouter;
