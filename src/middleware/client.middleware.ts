import { Request, Response, NextFunction } from "express";

export const detectClient = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const clientType =
    req.headers["x-client-type"] || "web";

  (req as any).clientType = clientType;

  next();
};