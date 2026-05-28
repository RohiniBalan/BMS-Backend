import { AuthRepository } from "../repositories/auth.repository";
import { validatePassword } from "../utils/passwordValidator";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { transporter } from "../utils/mail";
import crypto from "crypto";
import bcrypt from "bcrypt";

export class AuthService {
  private repo = new AuthRepository();

  // ---------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
  }) {
    const existing = await this.repo.findUserByEmail(data.email);
    if (existing) throw new Error("Email already registered");

    if (data.password !== data.confirmPassword)
      throw new Error("Passwords do not match");

    if (!validatePassword(data.password))
      throw new Error(
        "Password must be 8+ chars and include uppercase, lowercase, number, and special character"
      );

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await this.repo.createUser({
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      phoneNumber: data.phoneNumber,
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    return { user: { id: user.id, email: user.email, role: user.role }, accessToken };
  }

  // ---------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------
  async login(email: string, password: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user || !user.password) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

    // Account lock check
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMs = user.lockUntil.getTime() - Date.now();
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      throw new Error(`Account locked. Try again after ${minutes}m ${seconds}s`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const attempts = user.loginAttempts + 1;
      if (attempts >= 15) {
        const randomSeconds = Math.floor(Math.random() * 121) + 60;
        await this.repo.lockUser(user.id, new Date(Date.now() + randomSeconds * 1000));
        const m = Math.floor(randomSeconds / 60);
        const s = randomSeconds % 60;
        throw new Error(`Too many failed attempts. Account locked for ${m}m ${s}s`);
      }
      await this.repo.updateLoginAttempts(user.id, attempts);
      throw new Error(`Invalid credentials. Attempt ${attempts}/15`);
    }

    await this.repo.resetLoginAttempts(user.id);

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const rawRefresh = signRefreshToken({ id: user.id, email: user.email, role: user.role });
    const hashedRefresh = crypto.createHash("sha256").update(rawRefresh).digest("hex");
    await this.repo.updateRefreshToken(user.id, hashedRefresh);

    return { user: { id: user.id, email: user.email, role: user.role }, accessToken, refreshToken: rawRefresh };
  }

  // ---------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------
  async logout(userId: string) {
    await this.repo.updateRefreshToken(userId, null);
    return true;
  }

  // ---------------------------------------------------------------
  // Refresh Token (rotation)
  // ---------------------------------------------------------------
  async refresh(oldRefreshToken: string) {
    const hashed = crypto.createHash("sha256").update(oldRefreshToken).digest("hex");
    const user = await this.repo.findUserByRefreshToken(hashed);
    if (!user) throw new Error("Invalid refresh token");

    const newAccess = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRawRefresh = signRefreshToken({ id: user.id, email: user.email, role: user.role });
    const newHashed = crypto.createHash("sha256").update(newRawRefresh).digest("hex");
    await this.repo.updateRefreshToken(user.id, newHashed);

    return { accessToken: newAccess, refreshToken: newRawRefresh };
  }

  // ---------------------------------------------------------------
  // Forgot Password (no enumeration)
  // ---------------------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.repo.findUserByEmail(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
      await this.repo.saveResetToken(user.id, token, expiry);
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "BMS – Password Reset",
        html: `<h3>Password Reset</h3><p>Click below to reset your password (expires in 1 hour):</p><a href="${resetLink}">${resetLink}</a>`,
      });
    }
    return { message: "If the email exists, a reset link has been sent" };
  }

  // ---------------------------------------------------------------
  // Reset Password
  // ---------------------------------------------------------------
  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    if (newPassword !== confirmPassword) throw new Error("Passwords do not match");
    if (!validatePassword(newPassword))
      throw new Error(
        "Password must be 8+ chars and include uppercase, lowercase, number, and special character"
      );

    const user = await this.repo.findUserByResetToken(token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date())
      throw new Error("Invalid or expired token");

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePassword(user.id, hashed);
    return { message: "Password reset successful" };
  }

  // ---------------------------------------------------------------
  // OAuth upsert (used by passport callbacks)
  // ---------------------------------------------------------------
  async handleOAuth(
    provider: "GOOGLE" | "MICROSOFT",
    profile: { id: string; email: string; fullName?: string }
  ) {
    const existing = await this.repo.findUserByProviderId(profile.id, provider);
    if (existing) return existing;
    const user = await this.repo.createUser({
      fullName: profile.fullName ?? "",
      email: profile.email,
      password: "",
      acceptedTerms: true,
    });
    await this.repo.linkProvider(user.id, profile.id, provider);
    return user;
  }
}