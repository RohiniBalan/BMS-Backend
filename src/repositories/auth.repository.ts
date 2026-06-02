import prisma from "../prisma/prisma";
import { AuthProvider } from "@prisma/client";

export class AuthRepository {
  // ---------- User lookups ----------
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findUserByProviderId(providerId: string, provider: "GOOGLE" | "MICROSOFT") {
    return prisma.user.findFirst({
      where: {
        providerId,
        authProvider: provider as AuthProvider,
      },
    });
  }

  // ---------- Create ----------
  async createUser(data: {
    fullName: string;
    email: string;
    password: string;
    phoneNumber?: string;
    acceptedTerms?: boolean;
  }) {
    return prisma.user.create({ data });
  }

  // ---------- Refresh token ----------
  async updateRefreshToken(userId: string, hashedToken: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedToken },
    });
  }

  async findUserByRefreshToken(hashedToken: string) {
    return prisma.user.findFirst({ where: { refreshToken: hashedToken } });
  }

  // ---------- Password reset ----------
  async saveResetToken(userId: string, token: string, expiry: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });
  }

  async findUserByResetToken(token: string) {
    return prisma.user.findFirst({ where: { resetToken: token } });
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
  }

  // ---------- Login attempts & lock ----------
  async updateLoginAttempts(userId: string, attempts: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: attempts },
    });
  }

  async lockUser(userId: string, lockUntil: Date) {
    return prisma.user.update({
      where: { id: userId },
      data: { lockUntil, loginAttempts: 0 },
    });
  }

  async resetLoginAttempts(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: 0, lockUntil: null },
    });
  }

  // ---------- Provider linking ----------
  async linkProvider(userId: string, providerId: string, provider: "GOOGLE" | "MICROSOFT") {
    return prisma.user.update({
      where: { id: userId },
      data: {
        providerId,
        authProvider: provider as AuthProvider,
      },
    });
  }

  // ----------Phone number -------------
  async findUserByPhone(phoneNumber: string) {
    return prisma.user.findFirst({
      where: { phoneNumber },
    });
  }
}