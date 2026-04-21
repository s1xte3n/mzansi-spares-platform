import express from "express";
import { fileURLToPath } from "node:url";
import { createSearchRepository } from "./repository.js";

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function hasTenantScope(authContext, tenantId) {
  return (
    authContext?.scopes?.isPlatformStaff ||
    (authContext?.tenants ?? []).some((membership) => membership.tenantId === tenantId) ||
    (authContext?.vendors ?? []).some((membership) => membership.tenantId === tenantId)
  );
}

function fitmentLabel(product) {
  const path = [product.makeName, product.modelName, product.derivativeName]
    .filter(Boolean)
    .join(" / ");
  if (!path) {
    return product.fitmentNotes
      ? `Fitment notes: ${product.fitmentNotes}`
      : "Fitment not specified";
  }

  return product.fitmentNotes ? `${path} (${product.fitmentNotes})` : path;
}

function toSearchResponse(results) {
  return {
    products: results.products.map((item) => ({
      ...item,
      label: `${item.title} · ${item.sku}`,
      fitmentLabel: fitmentLabel(item)
    })),
    vendors: results.vendors.map((item) => ({
      ...item,
      label: `${item.name} (${item.code})`
    })),
    orders: results.orders.map((item) => ({
      ...item,
      label: `${item.orderNumber} · ${item.status}`
    }))
  };
}

export function createApp(
  serviceName = process.env.SERVICE_NAME || "search-sync-service",
  repository = createSearchRepository()
) {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: serviceName,
      sourceOfTruth: repository.usingPostgres ? "postgres" : "in-memory-fallback",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/search", async (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.query.tenantId || req.header("x-tenant-id") || authContext.activeTenantId;
    const q = String(req.query.q || "").trim();
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));

    if (!tenantId) {
      return res.status(400).json({ error: "tenantId or x-tenant-id required" });
    }

    if (!hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    if (!q) {
      return res.json({ products: [], vendors: [], orders: [] });
    }

    const results = await repository.search({ tenantId, q, limit });
    return res.json(toSearchResponse(results));
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "search-sync-service";
  const app = createApp(serviceName);
  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
