import { Router, Request, Response } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate";
import { authRateLimiter } from "../middleware/rateLimiter";
import {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.schema";
import { sendError } from "../utils/response";

const router = Router();
const controller = new AuthController();

// ---------- Public routes (rate limited) ----------

// POST /api/v1/auth/register
router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  controller.register.bind(controller)
);

// POST /api/v1/auth/login
router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  controller.login.bind(controller)
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  authRateLimiter,
  validate(refreshSchema),
  controller.refresh.bind(controller)
);

// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  authRateLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword.bind(controller)
);

// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword.bind(controller)
);

// ---------- Protected routes ----------

// POST /api/v1/auth/logout  (requires valid access token)
router.post(
  "/logout",
  authenticate,
  validate(logoutSchema),
  controller.logout.bind(controller)
);

// ---------- OAuth routes (conditionally registered) ----------

// Only register Google routes when env vars are configured
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  // Lazy-require passport to avoid loading strategy at module parse time
  const passport = require("passport");
  require("../config/passport"); // register Google strategy

  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    controller.googleCallback.bind(controller)
  );
} else {
  router.get("/google", (_req: Request, res: Response) =>
    sendError(res, 501, "Google OAuth is not configured")
  );
  router.get("/google/callback", (_req: Request, res: Response) =>
    sendError(res, 501, "Google OAuth is not configured")
  );
}

// Only register Microsoft routes when env vars are configured
if (
  process.env.MICROSOFT_CLIENT_ID &&
  process.env.MICROSOFT_CLIENT_SECRET &&
  process.env.MICROSOFT_CALLBACK_URL
) {
  const passport = require("passport");
  require("../config/microsoft.strategy"); // register OIDC strategy

  router.get(
    "/microsoft",
    passport.authenticate("azuread-openidconnect", { scope: ["profile", "email"] })
  );

  router.get(
    "/microsoft/callback",
    passport.authenticate("azuread-openidconnect", { session: false }),
    controller.microsoftCallback.bind(controller)
  );
} else {
  router.get("/microsoft", (_req: Request, res: Response) =>
    sendError(res, 501, "Microsoft OAuth is not configured")
  );
  router.get("/microsoft/callback", (_req: Request, res: Response) =>
    sendError(res, 501, "Microsoft OAuth is not configured")
  );
}

export default router;