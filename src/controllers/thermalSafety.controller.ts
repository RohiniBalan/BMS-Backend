import { Request, Response, NextFunction } from "express";
import {ThermalSafetyService} from "../services/thermalSafety.service";

const service = new ThermalSafetyService();

export class ThermalSafetyController{
  
  // Create Thermal Safety
  async createThermalSafety(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const {
      parameterName,
      thresholdValue,
      actionName,
    } = req.body;

    if (
      !parameterName ||
      !thresholdValue ||
      !actionName
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const thermalSafety =
      await service.createThermalSafety(
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Thermal Safety created successfully",
      data: thermalSafety,
    });

  } catch (error) {
    next(error);
  }
}

  // Get All Thermal Safety
  async getAllThermalSafety  (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const thermalSafety = await service.getAllThermalSafety();

      res.status(200).json({
        success: true,
        data: thermalSafety,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Thermal Safety By ID
  async getThermalSafetyById (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number(req.params.id);
          const thermalSafety = await service.getThermalSafetyById(id);
          if(!thermalSafety){
              return res.status(404).json({
                  success: false,
                  message: "Thermal Safety not found",
              })
          }
          res.status(200).json({
              success: true,
              data: thermalSafety,
          })
      }
      catch(error){
          next(error)
      };
  }

  // Update Thermal Safety
  async updateThermalSafety(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const id = Number(req.params.id);

    const updatedThermalSafety =
      await service.updateThermalSafety(
        id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Thermal Safety updated successfully",
      data: updatedThermalSafety,
    });

  } catch (error) {
    next(error);
  }
}

  // Delete Thermal Safety
async deleteThermalSafety(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const id = Number(req.params.id);

    await service.deleteThermalSafety(id);

    res.status(200).json({
      success: true,
      message:
        "Thermal Safety deleted successfully",
    });

  } catch (error) {
    next(error);
  }
}

  // Config Handlers
  // Create Config
async createThermalSafetyConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const {
      vehicleName,
      customThreshold,
      thermalSafetyId,
    } = req.body;

    if (
      !vehicleName ||
      !customThreshold ||
      !thermalSafetyId
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const config =
      await service.createConfig(req.body);

    res.status(201).json({
      success: true,
      message:
        "Thermal Safety Config created successfully",
      data: config,
    });

  } catch (error) {
    next(error);
  }
}

  // Get All Thermal Safety Configs
  async getAllThermalSafetyConfigs (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const configs =
      await service.getConfigs({});
  
      res.status(200).json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  };

  // Get Thermal Safety Config by ID
  async getThermalSafetyConfigById (
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = Number(req.params.id);
  
      const config =
  await service.getConfigById(id);
  
      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Thermal Safety Config not found",
        });
      }
  
      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  };

  // Update Thermal Safety Config
async updateThermalSafetyConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const id = Number(req.params.id);

    const updatedConfig =
      await service.updateConfig(
        id,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Thermal Safety Config updated successfully",
      data: updatedConfig,
    });

  } catch (error) {
    next(error);
  }
}

  // Delete Thermal Safety Config
async deleteThermalSafetyConfig(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const id = Number(req.params.id);

    await service.deleteConfig(id);

    res.status(200).json({
      success: true,
      message:
        "Thermal Safety Config deleted successfully",
    });

  } catch (error) {
    next(error);
  }
}
}