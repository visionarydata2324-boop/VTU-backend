import express, {Request, Response, NextFunction} from 'express';
import { DataCntroller as gladTidingsController } from '../controllers/GladTidingsDataController';
import { gsubzDataController } from '../controllers/GsubzDataController';
import { authController } from '../controllers/authController';
import { SELECTED_CONTROLLER } from '../utils/types/index';


const dataContollerRoute = express.Router();

const dataCntroller = new gladTidingsController();



// Middleware to select controller based on service type
function selectController(req: SELECTED_CONTROLLER, res: Response, next: NextFunction) {
    const serviceType = req.headers['x-service-type'];
    console.log(`header has service: ${req.headers['x-service-type']}`)

    if (serviceType === 'gladtidings') {
        req.selectedController = new gladTidingsController();
    } else if (serviceType === 'gsubz') {
        req.selectedController = gsubzDataController;
    } else {
        res.status(400).json({ error: 'Invalid service type selected.' });
        return
    }

    next();
}


dataContollerRoute.post('/buy-data',authController.authenticationToken, selectController, (req: SELECTED_CONTROLLER, res: Response, next: NextFunction) => {
    if (req.selectedController == new gladTidingsController){
        req.selectedController.buyData(req, res)
    }
    else {
        req.selectedController.buyGsubzData(req, res, next)
    }
});
dataContollerRoute.post('/find-data', authController.authenticationToken, selectController, (req: SELECTED_CONTROLLER, res: Response) => {
     if (req.selectedController == gsubzDataController){
        req.selectedController.findGsubzData(req, res)
    }
    else {
        req.selectedController.findData(req, res)
    }
});


// dataContollerRoute.post('/findgSubz-data',  authController.authenticationToken, selectController, (req: SELECTED_CONTROLLER, res: Response) => {
//     req.selectedController.findData(req, res)
// })
// dataContollerRoute.post('/buy-data', authController.authenticationToken, selectController, (req: SELECTED_CONTROLLER, res: Response) => {
//     req.selectedController.buyGsubzData(req, res)
// });



export default dataContollerRoute;