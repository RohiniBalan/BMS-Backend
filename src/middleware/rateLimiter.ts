import rateLimit from 'express-rate-limit';

// Apply to public auth endpoints: 100 requests per minute per IP
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
