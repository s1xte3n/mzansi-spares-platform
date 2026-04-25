import express from "express";
import { fileURLToPath } from "node:url";
import { resolveAuthorizationContext } from "./contextResolver.js";

export function createApp(serviceName = process.env.SERVICE_NAME || "identity-service") {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      timestamp: new Date().toISOString()
    });
  });

  app.get("/internal/auth-context", async (req, res) => {
    const clerkUserId = req.headers["x-clerk-user-id"];

    if (!clerkUserId || Array.isArray(clerkUserId)) {
      return res.status(400).json({ error: "Missing x-clerk-user-id header" });
    }

    const context = await resolveAuthorizationContext({
      clerkUserId,
      requestedTenantId: req.headers["x-tenant-id"],
      requestedVendorId: req.headers["x-vendor-id"]
    });

    if (!context) {
      return res.status(403).json({ error: "Authorization context denied" });
    }

    return res.status(200).json(context);
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "identity-service";
  const app = createApp(serviceName);

  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
