const RATE_LIMIT_PATTERN = /429|rate.?limit|too many requests/i;

export const corsairRateLimitHandler = {
  match: (error: Error) => RATE_LIMIT_PATTERN.test(error.message),
  handler: async (error: Error, context: { operation: string }) => {
    console.warn(`[corsair] rate limit on ${context.operation}:`, error.message);
    return {
      maxRetries: 3,
      retryStrategy: "exponential_backoff_jitter" as const,
    };
  },
};

export const corsairDefaultHandler = {
  match: () => true,
  handler: async (error: Error, context: { operation: string }) => {
    console.error(`[corsair] ${context.operation}:`, error.message);
    return { maxRetries: 0 };
  },
};

export const pluginErrorHandlers = {
  RATE_LIMIT_ERROR: corsairRateLimitHandler,
  DEFAULT: corsairDefaultHandler,
};

export const rootErrorHandlers = {
  RATE_LIMIT_ERROR: corsairRateLimitHandler,
  DEFAULT: corsairDefaultHandler,
};
