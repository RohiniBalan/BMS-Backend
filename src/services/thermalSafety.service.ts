import { ThermalSafetyRepository }
from "../repositories/thermalSafety.repository";

import { Prisma } from "@prisma/client";

export class ThermalSafetyService {

  private repo = new ThermalSafetyRepository();


  // =========================
  // THERMAL SAFETY METHODS
  // =========================

  async getAllThermalSafety() {
    return this.repo.findAllThermalSafety();
  }

  async getThermalSafetyById(id: number) {
    return this.repo.findThermalSafetyById(id);
  }

  async createThermalSafety(
    data: Prisma.ThermalSafetyCreateInput
  ) {

    const existing =
      await this.repo.findThermalSafetyByParameter(
        data.parameterName
      );

    if (existing) {
      throw new Error(
        `Thermal Safety parameter '${data.parameterName}' already exists.`
      );
    }

    return this.repo.createThermalSafety(data);
  }

  async updateThermalSafety(
    id: number,
    data: Prisma.ThermalSafetyUpdateInput
  ) {

    const existing =
      await this.repo.findThermalSafetyById(id);

    if (!existing) {
      throw new Error(
        `Thermal Safety with ID '${id}' not found.`
      );
    }

    return this.repo.updateThermalSafety(
      id,
      data
    );
  }

  async deleteThermalSafety(id: number) {

    const existing =
      await this.repo.findThermalSafetyById(id);

    if (!existing) {
      throw new Error(
        `Thermal Safety with ID '${id}' not found.`
      );
    }

    return this.repo.deleteThermalSafety(id);
  }


  // =========================
  // THERMAL SAFETY CONFIG METHODS
  // =========================

  async getConfigs(filters: {
    thermalSafetyId?: number;
    vehicleName?: string;
    coolingEnabled?: boolean;
  }) {

    return this.repo.findAllConfigs(filters);
  }

  async getConfigById(id: number) {
    return this.repo.findConfigById(id);
  }

  async createConfig(
    data: Prisma.ThermalSafetyConfigUncheckedCreateInput
  ) {

    const thermalSafety =
      await this.repo.findThermalSafetyById(
        data.thermalSafetyId
      );

    if (!thermalSafety) {
      throw new Error(
        `Thermal Safety with ID '${data.thermalSafetyId}' not found.`
      );
    }

    return this.repo.createConfig(data);
  }

  async updateConfig(
    id: number,
    data: Prisma.ThermalSafetyConfigUpdateInput
  ) {

    const existing =
      await this.repo.findConfigById(id);

    if (!existing) {
      throw new Error(
        `Thermal Safety Config with ID '${id}' not found.`
      );
    }

    return this.repo.updateConfig(id, data);
  }

  async deleteConfig(id: number) {

    const existing =
      await this.repo.findConfigById(id);

    if (!existing) {
      throw new Error(
        `Thermal Safety Config with ID '${id}' not found.`
      );
    }

    return this.repo.deleteConfig(id);
  }
}