import { UserRequest } from '../../utils/types';
import { Request, Response, NextFunction } from 'express';
import { Data } from '../../models/dataPlans';
import { AppError } from '../../utils/HandleErrors';
import { logger } from '../../utils/logger';
import { DBdataSet } from '../../utils/types/db_Data_set';

interface SKUConfig {
  prefix?: string;
  length: number;
  includeTimestamp?: boolean;
  separator?: string;
}
class DataPrice {
    
    constructor() {
      
    }

    public createData = async ( req: UserRequest, res: Response, next: NextFunction): Promise<any> => {
      let num = 0
      function generateUniqueSKU(config: SKUConfig): string {
        const {
          prefix = '',
          length,
          includeTimestamp = false,
          separator = '-',
        } = config;
      
        // Validate configuration
        if (length < 4) {
          throw new Error('SKU length must be at least 4 characters');
        }
      
        // Generate random string component
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        
        // Adjust length based on prefix and timestamp
        const effectiveLength = Math.max(4, length - prefix.length - (includeTimestamp ? 13 : 0));
        
        for (let i = 0; i < effectiveLength; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          randomPart += characters[randomIndex];
        }
      
        // Build SKU components
        const parts: string[] = [];
        
        if (prefix) {
          parts.push(prefix);
        }
      
        if (includeTimestamp) {
          parts.push(Date.now().toString(36).toUpperCase());
        }
      
        parts.push(randomPart);
      
        return parts.join(separator);
      }
        try {
              const { networkProvider, plan, price, duration, serviceType }: DBdataSet = req.body;
              const who = req.user.role
            
              // Check if the data plan exists
              const data: any = await Data.findOne({ networkProvider, size:plan });
              if ( data !== null ) {
                throw new AppError('Data plan already exists', 400);
              }

              // Create a new data
              const newData = new Data({ networkProvider, plan, price, duration, serviceType, setBy: who, sku:generateUniqueSKU({ 
                prefix: 'DATA', 
                length: 20, 
                includeTimestamp: true,
                separator: '_' 
              })});
              const saved = await newData.save();
              if(!saved){
                throw new AppError("New data not created")
              }
              res.status(201).json(newData);
        } catch (error: any) {
          logger.error({error: error.message});
          res.json({error: error.message});
        }
    }


    // Update price for a specific network provider and bundle type (admin only)
public updateData = async (req: UserRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { networkProvider, plan, price, duration, serviceType }: DBdataSet = req.body;
    console.log(networkProvider, plan)

    const update: DBdataSet = {
      networkProvider,
      plan,
      price,
      duration,
      serviceType,
      setBy: req.user.role
    }

    // Find and update the price
    const updateData = await Data.findOneAndUpdate(
      { networkProvider, plan },
      { $set: update },
      { new: true }
    );
  console.log({updateData})
    if (!updateData) {
      throw new AppError('Data plan not found. Please create one', 404);
    }
    const updateSatus = updateData? true : false;
  
    res.status(200).json({status: updateSatus, updateData});
  } catch (error: any) {
    logger.error({error: error.message});
    res.json({error: error.message});
  }
}

// Get all prices for a specific network provider
public getNetworkData =  async (req: Request, res: Response): Promise<void> => {
  try {
    const { networkProvider } = req.params
    console.log(networkProvider)
    const data = await Data.find({ networkProvider })
    if (!data) {
      throw new AppError("Data not found", 404)
    }
    res.json(data);
  } catch (error: any) {
    res.status(404).json(error.message)
  }
}

//Get all data
public allData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const data = await Data.find()
    if(!data) {
      throw new AppError("ata not found", 404)
    }
    res.json(data)
  } catch (error: any) {
    res.json(error.message)
  }
}
  public deleteData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { sku } = req.params;
      const deletedData = await Data.findOneAndDelete({ sku });
      if (!deletedData) {
        throw new AppError('Data plan not found', 404);
      }
      res.status(200).json({ message: 'Data plan deleted successfully' });
    } catch (error: any) {
      logger.error({ error: error.message });
      res.json({ error: error.message });
    }
  }
  public getSingleData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const { sku } = req.params;
      const data = await Data.find ({ sku });
      if (!data) {
        throw new AppError('Data plan not found', 404);
      } 
      res.status(200).json(data);
    } catch (error: any) {
      logger.error({ error: error.message });
      res.json({ error: error.message });
    }
  }

}


export const newDataPrice = new DataPrice();