const rateBuckets = new Map();

export function getSentryConfig() {
  return {
    enabled: Boolean(process.env.SENTRY_DSN),
    dsn: process.env.SENTRY_DSN || null,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0)
  };
}

export function initializeSentryPlaceholder(serviceName) {
  const config = getSentryConfig();
  if (!config.enabled) {
    return { enabled: false, serviceName };
  }

  return {
    enabled: true,
    serviceName,
    dsnConfigured: true,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate
  };
}

export function correlationIdMiddleware(req, res, next) {
  const correlationId = req.header("x-correlation-id") || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  next();
}

export function createStructuredLogger(serviceName) {
  return function log(level, message, details = {}) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        service: serviceName,
        message,
        ...details
      })
    );
  };
}

export function requestLogMiddleware(logger) {
  return (req, _res, next) => {
    logger("info", "request.received", {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path
    });
    next();
  };
}

export function rateLimitSensitiveRoutes({ windowMs = 60_000, max = 30 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key) || { count: 0, windowStart: now };

    if (now - bucket.windowStart > windowMs) {
      bucket.count = 0;
      bucket.windowStart = now;
    }

    bucket.count += 1;
    rateBuckets.set(key, bucket);

    if (bucket.count > max) {
      return res.status(429).json({ error: "Rate limit exceeded" });
    }

    return next();
  };
}
