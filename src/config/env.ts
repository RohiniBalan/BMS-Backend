import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string().min(1),

  // JWT
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().optional(),   // falls back to JWT_SECRET when absent
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Frontend
  FRONTEND_URL: z.string().url().optional(),

  // Email
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),

  // Google OAuth  (all optional — app compiles without them)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Microsoft OAuth  (all optional)
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT_ID: z.string().optional(),
  MICROSOFT_CALLBACK_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
