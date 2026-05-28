import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { sendSuccess, sendError } from "../utils/response";

const service = new AuthService();

export class AuthController {
  // POST /register
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.register(req.body);
      return sendSuccess(res, "Registered successfully", result);
    } catch (err) {
      next(err);
    }
  }

  // POST /login
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await service.login(email, password);
      return sendSuccess(res, "Login successful", result);
    } catch (err) {
      next(err);
    }
  }

  // POST /logout  (protected)
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return sendError(res, 401, "Unauthorized");
      await service.logout(userId);
      return sendSuccess(res, "Logged out successfully");
    } catch (err) {
      next(err);
    }
  }

  // POST /refresh
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await service.refresh(refreshToken);
      return sendSuccess(res, "Token refreshed", result);
    } catch (err) {
      next(err);
    }
  }

  // POST /forgot-password
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await service.forgotPassword(email);
      return sendSuccess(res, result.message);
    } catch (err) {
      next(err);
    }
  }

  // POST /reset-password
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password, confirmPassword } = req.body;
      const result = await service.resetPassword(token, password, confirmPassword);
      return sendSuccess(res, result.message);
    } catch (err) {
      next(err);
    }
  }

  // GET /google/callback  (OAuth)
  async googleCallback(req: any, res: any) {
    const token = generateToken(req.user.id, req.user.email, req.user.role);
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }

  // GET /microsoft/callback  (OAuth)
  async microsoftCallback(req: any, res: any) {
    const token = generateToken(req.user.id, req.user.email, req.user.role);
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}`);
  }
}