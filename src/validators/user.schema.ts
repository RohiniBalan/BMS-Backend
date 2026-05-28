import { z } from "zod";
import { Role } from "@prisma/client";

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
  body: z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters").optional(),
    phoneNumber: z.string().nullable().optional(),
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
  }),
});
