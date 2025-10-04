import { AppError } from "../../utils/HandleErrors";
import { ServiceType } from "../../models/serviceType";
import express, { Request, Response, NextFunction } from "express";



class ServiceController {
  public async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, } = req.body;
      // Validate the request body
      if (!name || !description) {
        throw new AppError("Name and description are required", 400);
      }

      // Create a new service
      const newService = await ServiceType.create({
        name,
        description,
      });
      if (!newService) {
        throw new AppError("Service creation failed", 500);
      }
      newService.save();

      res.json({ service: newService });
    } catch (error: any ) {
      res.status(error.statuscode).json({ error: error.message });
    }
  }

  public async getAllServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await ServiceType.find();
      if (!services) {
        throw new AppError("No services found", 404);
      }
      res.json({ services });
    } catch (error: any) {
      res.status(error.status).json({ error: error.message });
    }
  }
}

export const serviceController = new ServiceController();