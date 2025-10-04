import express from 'express';
import { authController } from '../../controllers/authController';
import { gSubzTvService } from '../../services/TV_Services';

import { gSubzCableTV } from '../../controllers/GSubzTVController';



const TVRouter = express.Router();


TVRouter.post('/find-cable-tv',  authController.authenticationToken, authController.isAdmin, gSubzCableTV.findAllGSubzTVPackage);
TVRouter.post('/update-cabletv', authController.authenticationToken, authController.isAdmin,gSubzCableTV.editOneInternalCableTV  );
TVRouter.post('/create-cabletv', authController.authenticationToken, authController.isAdmin, gSubzCableTV.createTVData);
TVRouter.post('/delet-cabletv', authController.authenticationToken, authController.isAdmin, gSubzCableTV.deleteOneCableTV)


export default TVRouter;