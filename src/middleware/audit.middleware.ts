import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import prisma from "../prisma/prisma";

export const auditLog = (action: string, entity: string, getEntityId: string | ((req: AuthRequest) => string)) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // We capture the end of the request to ensure it actually succeeded before logging?
    // Or we log it immediately. The usual way is logging immediately or after.
    // Let's log it immediately before proceeding.
    try {
      if (req.user) {
        let entityId = "SYSTEM";
        if (typeof getEntityId === "function") {
          entityId = getEntityId(req);
        } else if (getEntityId === "req.params.id") {
          entityId = req.params.id || "UNKNOWN";
        } else {
          entityId = getEntityId;
        }

        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entity,
            entityId,
            details: {
              body: req.body,
              query: req.query,
              params: req.params,
            },
            ipAddress: req.ip || req.socket.remoteAddress || null,
          },
        });
      }
    } catch (err) {
      console.error("Failed to create audit log", err);
    }

    next();
  };
};
