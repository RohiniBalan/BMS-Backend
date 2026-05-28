import { BatteryRepository } from "../repositories/battery.repository";
import { Prisma } from "@prisma/client";

export class BatteryService {
  private repo = new BatteryRepository();

  // Chemistry Methods
  async getChemistries() {
    return this.repo.findAllChemistries();
  }

  async getChemistryById(id: string) {
    return this.repo.findChemistryById(id);
  }

  async createChemistry(data: Prisma.BatteryChemistryCreateInput) {
    const existing = await this.repo.findChemistryByName(data.chemistryName);
    if (existing) {
      throw new Error(`Battery chemistry with name '${data.chemistryName}' already exists.`);
    }
    return this.repo.createChemistry(data);
  }

  async updateChemistry(id: string, data: Prisma.BatteryChemistryUpdateInput) {
    const existing = await this.repo.findChemistryById(id);
    if (!existing) {
      throw new Error(`Battery chemistry with ID '${id}' not found.`);
    }
    return this.repo.updateChemistry(id, data);
  }

  async deleteChemistry(id: string) {
    const existing = await this.repo.findChemistryById(id);
    if (!existing) {
      throw new Error(`Battery chemistry with ID '${id}' not found.`);
    }
    return this.repo.deleteChemistry(id);
  }

  // Config Methods
  async getConfigs(filters: { chemistryId?: string; vehicleModel?: string; isActive?: boolean }) {
    return this.repo.findAllConfigs(filters);
  }

  async getConfigById(id: string) {
    return this.repo.findConfigById(id);
  }

  async createConfig(data: Prisma.ChemistryConfigUncheckedCreateInput) {
    const chemistry = await this.repo.findChemistryById(data.chemistryId);
    if (!chemistry) {
      throw new Error(`Battery chemistry with ID '${data.chemistryId}' not found.`);
    }
    return this.repo.createConfig(data);
  }

  async updateConfig(id: string, data: Prisma.ChemistryConfigUpdateInput) {
    const existing = await this.repo.findConfigById(id);
    if (!existing) {
      throw new Error(`Chemistry configuration with ID '${id}' not found.`);
    }
    return this.repo.updateConfig(id, data);
  }

  async deleteConfig(id: string) {
    const existing = await this.repo.findConfigById(id);
    if (!existing) {
      throw new Error(`Chemistry configuration with ID '${id}' not found.`);
    }
    return this.repo.deleteConfig(id);
  }
}