import express from "express"
import { quickTellerController } from "../controllers/quictellerController"

const quickTellerRouter = express.Router()

quickTellerRouter.post("/card-payment", quickTellerController.cardPayment)  

export default quickTellerRouter;