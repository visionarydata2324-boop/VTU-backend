import express from "express"
import authRouter from "./authRoutes"
import paymentRouter from "./payment"
import dataContollerRoute from "./buyGladTingsDataRoute"

//Admin Router
import dataRoute from "./Admins/dataCreateRoute"
import userAdminRoute from './Admins/userAdminOperations';
import BuyAirtimeRoute from './BuyAirtime';
import ElectricRouter from './buyGSubzElectric';
import TVRouter from './Admins/gSubzTV_AdminRoutes';
import userTVroute from './gSubzTVRoutes';

const router = express.Router()

router.use('/api/v1', authRouter )
router.use('/api/v1', paymentRouter )
router.use('/api/v1', dataContollerRoute)
router.use('/api/v1', BuyAirtimeRoute)
router.use('/api/v1', ElectricRouter)
router.use('/api/v1', userTVroute)



router.use('/api/v1/admin', dataRoute)
router.use('/api/v1/admin', userAdminRoute)
router.use('/api/v1/admin', TVRouter)



export default router;