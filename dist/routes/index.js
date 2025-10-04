"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const payment_1 = __importDefault(require("./payment"));
const buyDataRoute_1 = __importDefault(require("./buyDataRoute"));
const quictellerRoutes_1 = __importDefault(require("./quictellerRoutes"));
//Admin Router
const dataCreateRoute_1 = __importDefault(require("./Admins/dataCreateRoute"));
const router = express_1.default.Router();
router.use('/api/v1', authRoutes_1.default);
router.use('/api/v1', payment_1.default);
router.use('/api/v1', buyDataRoute_1.default);
router.use('/api/v1', quictellerRoutes_1.default);
router.use('/api/v1/admin', dataCreateRoute_1.default);
exports.default = router;
