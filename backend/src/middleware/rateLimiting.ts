import rateLimit from 'express-rate-limit';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiting (more restrictive)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: {
    error: 'Too many file uploads, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Subscription-based rate limiting
export const createSubscriptionBasedLimiter = (tier: string) => {
  const limits = {
    free: { windowMs: 60 * 1000, max: 60 }, // 60 requests per minute
    normal: { windowMs: 60 * 1000, max: 300 }, // 300 requests per minute
    enterprise: { windowMs: 60 * 1000, max: 1000 }, // 1000 requests per minute
  };

  const config = limits[tier as keyof typeof limits] || limits.free;

  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    message: {
      error: `Rate limit exceeded for ${tier} subscription tier.`,
      tier,
      limit: config.max,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};