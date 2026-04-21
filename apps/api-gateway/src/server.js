import express from "express";
import { fileURLToPath } from "node:url";
import { AuthzError, requireTenantAccess, requireVendorAccess } from "@packages/authz/src/index.js";
import { authenticateRequest, resolveAuthContext } from "./authMiddleware.js";
import {
  correlationIdMiddleware,
  createStructuredLogger,
  initializeSentryPlaceholder,
  rateLimitSensitiveRoutes,
  requestLogMiddleware
} from "./observability.js";

export function createApp(serviceName = process.env.SERVICE_NAME || "api-gateway") {
  const app = express();
  const logger = createStructuredLogger(serviceName);
  const sentry = initializeSentryPlaceholder(serviceName);

  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(requestLogMiddleware(logger));

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      sentryEnabled: sentry.enabled,
      timestamp: new Date().toISOString()
    });
  });

  app.use(
    ["/api/protected/me", "/api/protected/tenant/:tenantId", "/api/protected/vendor/:vendorId"],
    rateLimitSensitiveRoutes({ max: Number(process.env.GATEWAY_SENSITIVE_RATE_LIMIT || 30) })
  );

  app.use("/api/protected", authenticateRequest, resolveAuthContext);

  app.get("/api/protected/me", (req, res) => {
    res.status(200).json(req.authContext);
  });

  app.get("/api/protected/tenant/:tenantId", (req, res) => {
    try {
      requireTenantAccess(req.authContext, req.params.tenantId);
      res.status(200).json({ ok: true, tenantId: req.params.tenantId });
    } catch (error) {
      if (error instanceof AuthzError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: "Unexpected authorization failure" });
    }
  });

  app.get("/api/protected/vendor/:vendorId", (req, res) => {
    try {
      requireVendorAccess(req.authContext, req.params.vendorId);
      res.status(200).json({ ok: true, vendorId: req.params.vendorId });
    } catch (error) {
      if (error instanceof AuthzError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: "Unexpected authorization failure" });
    }
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "api-gateway";
  const app = createApp(serviceName);

  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
