import jwt, { SignOptions } from "jsonwebtoken";

/**
 * Sign a short-lived access token (default 15m).
 */
export const signAccessToken = (payload: { id: string; email: string; role: string }): string => {
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "15m") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, process.env.JWT_SECRET!, options);
};

/**
 * Sign a long-lived refresh token (default 7d).
 */
export const signRefreshToken = (payload: { id: string; email: string; role: string }): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, secret, options);
};

/** Verify an access token — throws on invalid/expired */
export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

/** Verify a refresh token — throws on invalid/expired */
export const verifyRefreshToken = (token: string): any => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
  return jwt.verify(token, secret);
};

/** Backward-compatible alias */
export const generateToken = (id: string, email: string, role: string): string =>
  signAccessToken({ id, email, role });