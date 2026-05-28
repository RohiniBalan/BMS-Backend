import type { Request, Response, NextFunction } from "express";
import { BatteryService } from "../services/battery.service";

const service = new BatteryService();

export class BatteryController {
  // Chemistry Handlers
  async getChemistries(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getChemistries();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getChemistryById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.getChemistryById(id);
      if (!data) {
        return res.status(404).json({ success: false, error: "Battery chemistry not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createChemistry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.createChemistry(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateChemistry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.updateChemistry(id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteChemistry(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.deleteChemistry(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Config Handlers
  async getConfigs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        chemistryId: req.query.chemistryId as string | undefined,
        vehicleModel: req.query.vehicleModel as string | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
      };
      const data = await service.getConfigs(filters);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getConfigById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.getConfigById(id);
      if (!data) {
        return res.status(404).json({ success: false, error: "Configuration not found" });
      }
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.createConfig(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.updateConfig(id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const data = await service.deleteConfig(id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  // Keep compatibility for old paths
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.getChemistries();
      res.json(data);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await service.createChemistry(req.body);
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  }
}