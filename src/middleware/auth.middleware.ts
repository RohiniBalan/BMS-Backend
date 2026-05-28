import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

// Extend Express Request so downstream handlers can access req.user
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
    }
  }
}

export type AuthRequest = Request;

/**
 * Validates Bearer JWT on every protected route.
 * Attaches decoded payload to req.user.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Unauthorized");
    }
    const token = authHeader.split(" ")[1];
    req.user = verifyAccessToken(token) as Express.User;
    next();
  } catch {
    return sendError(res, 401, "Invalid or expired token");
  }
};