import prisma from "../prisma/prisma";
import { Prisma } from "@prisma/client";

export class ThermalSafetyRepository {

  // =========================
  // THERMAL SAFETY
  // =========================

  async createThermalSafety(
    data: Prisma.ThermalSafetyCreateInput
  ) {
    return prisma.thermalSafety.create({
      data,
    });
  }

  async findThermalSafetyById(id: number) {
    return prisma.thermalSafety.findUnique({
      where: { id },
      include: {
        configs: true,
      },
    });
  }

  async findThermalSafetyByParameter(
    parameterName: string
  ) {
    return prisma.thermalSafety.findFirst({
      where: {
        parameterName,
      },
    });
  }

  async findAllThermalSafety() {
    return prisma.thermalSafety.findMany({
      include: {
        configs: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateThermalSafety(
    id: number,
    data: Prisma.ThermalSafetyUpdateInput
  ) {
    return prisma.thermalSafety.update({
      where: { id },
      data,
    });
  }

  async deleteThermalSafety(id: number) {
    return prisma.thermalSafety.delete({
      where: { id },
    });
  }


  // =========================
  // THERMAL SAFETY CONFIG
  // =========================

  async createConfig(
    data: Prisma.ThermalSafetyConfigUncheckedCreateInput
  ) {
    return prisma.thermalSafetyConfig.create({
      data,
      include: {
        thermalSafety: true,
      },
    });
  }

  async findConfigById(id: number) {
    return prisma.thermalSafetyConfig.findUnique({
      where: { id },
      include: {
        thermalSafety: true,
      },
    });
  }

  async findAllConfigs(filters: {
    thermalSafetyId?: number;
    vehicleName?: string;
    coolingEnabled?: boolean;
  }) {

    const where: Prisma.ThermalSafetyConfigWhereInput = {};

    if (filters.thermalSafetyId) {
      where.thermalSafetyId =
        filters.thermalSafetyId;
    }

    if (filters.vehicleName) {
      where.vehicleName = {
        contains: filters.vehicleName,
        mode: "insensitive",
      };
    }

    if (
      typeof filters.coolingEnabled === "boolean"
    ) {
      where.coolingEnabled =
        filters.coolingEnabled;
    }

    return prisma.thermalSafetyConfig.findMany({
      where,
      include: {
        thermalSafety: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateConfig(
    id: number,
    data: Prisma.ThermalSafetyConfigUpdateInput
  ) {
    return prisma.thermalSafetyConfig.update({
      where: { id },
      data,
      include: {
        thermalSafety: true,
      },
    });
  }

  async deleteConfig(id: number) {
    return prisma.thermalSafetyConfig.delete({
      where: { id },
    });
  }
}