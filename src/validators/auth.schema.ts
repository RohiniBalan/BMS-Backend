import { z } from "zod";
import { validatePassword } from "../utils/passwordValidator";

// ---------------------------------------------------------------
// Shared password field (reuses existing validator, no duplication)
// ---------------------------------------------------------------
const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine(validatePassword, {
    message:
      "Password must contain uppercase, lowercase, number, and special character (@$!%*?&)",
  });

// ---------------------------------------------------------------
// Register
// ---------------------------------------------------------------
export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: passwordField,
    confirmPassword: z.string(),
    phoneNumber: z.string().min(1, "Phone number is required"),
  }).refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }),
});

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

// ---------------------------------------------------------------
// Logout  (no body needed; user identified via JWT)
// ---------------------------------------------------------------
export const logoutSchema = z.object({
  body: z.object({}).optional(),
});

// ---------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------
export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// ---------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

// ---------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------
export const resetPasswordSchema = z.object({
  body: z
    .object({
      token: z.string().min(1, "Reset token is required"),
      password: passwordField,
      confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
});
