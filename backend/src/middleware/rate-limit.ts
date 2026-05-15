import rateLimit from "express-rate-limit";

const json429 = (_req: unknown, res: unknown) => {
  (res as import("express").Response).status(429).json({
    success: false,
    message: "TooManyRequests",
  });
};

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, //15min
  limit: 450,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: json429,
  skip: (req) => (req as import("express").Request).path === "/auth/webhook",
});

export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,//
  limit: 85,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: json429,
});

export const submitResponseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 65,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: json429,
});
