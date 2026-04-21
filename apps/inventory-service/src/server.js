import express from "express";
import { fileURLToPath } from "node:url";
import {
  fulfillStock,
  getLowStockThreshold,
  getStockDetail,
  listLowStock,
  listStock,
  manualAdjustment,
  releaseStock,
  reserveStock,
  setLowStockThreshold,
  getTenantSettings,
  updateTenantSettings
} from "./store.js";

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function canManageInventory(authContext, tenantId, vendorId) {
  if (authContext?.scopes?.isPlatformStaff) {
    return true;
  }

  const tenantStaff = (authContext?.tenants ?? []).some(
    (membership) =>
      membership.tenantId === tenantId && ["tenant_admin", "tenant_staff"].includes(membership.role)
  );
  if (tenantStaff) {
    return true;
  }

  return (authContext?.vendors ?? []).some(
    (membership) => membership.tenantId === tenantId && membership.vendorId === vendorId
  );
}

export function createApp(serviceName = process.env.SERVICE_NAME || "inventory-service") {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res
      .status(200)
      .json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
  });

  app.get("/inventory/variants", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.header("x-tenant-id") || authContext.activeTenantId;

    if (!tenantId) {
      return res.status(400).json({ error: "x-tenant-id required" });
    }

    return res.json(listStock(tenantId));
  });

  app.get("/inventory/variants/:variantId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.header("x-tenant-id") || authContext.activeTenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "x-tenant-id required" });
    }

    const detail = getStockDetail(tenantId, req.params.variantId);
    if (!detail) {
      return res.status(404).json({ error: "Stock record not found" });
    }

    return res.json(detail);
  });

  app.post("/inventory/adjustments", (req, res) => {
    const authContext = parseAuthContext(req);
    const payload = req.body;

    if (!canManageInventory(authContext, payload.tenantId, payload.vendorId)) {
      return res.status(403).json({ error: "Inventory scope denied" });
    }

    try {
      const event = manualAdjustment(payload);
      return res.status(201).json(event);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/inventory/reservations", (req, res) => {
    const authContext = parseAuthContext(req);
    const payload = req.body;

    if (!canManageInventory(authContext, payload.tenantId, payload.vendorId)) {
      return res.status(403).json({ error: "Inventory scope denied" });
    }

    try {
      const event = reserveStock(payload);
      return res.status(201).json(event);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/inventory/releases", (req, res) => {
    const authContext = parseAuthContext(req);
    const payload = req.body;

    if (!canManageInventory(authContext, payload.tenantId, payload.vendorId)) {
      return res.status(403).json({ error: "Inventory scope denied" });
    }

    try {
      const event = releaseStock(payload);
      return res.status(201).json(event);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.post("/inventory/fulfillments", (req, res) => {
    const authContext = parseAuthContext(req);
    const payload = req.body;

    if (!canManageInventory(authContext, payload.tenantId, payload.vendorId)) {
      return res.status(403).json({ error: "Inventory scope denied" });
    }

    try {
      const event = fulfillStock(payload);
      return res.status(201).json(event);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  app.get("/inventory/low-stock", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.header("x-tenant-id") || authContext.activeTenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "x-tenant-id required" });
    }

    return res.json({
      threshold: getLowStockThreshold(tenantId),
      records: listLowStock(tenantId)
    });
  });

  app.get("/inventory/settings/:tenantId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.params.tenantId;

    const canRead =
      authContext?.scopes?.isPlatformStaff ||
      (authContext?.tenants ?? []).some((membership) => membership.tenantId === tenantId) ||
      (authContext?.vendors ?? []).some((membership) => membership.tenantId === tenantId);

    if (!canRead) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(getTenantSettings(tenantId));
  });

  app.patch("/inventory/settings/:tenantId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.params.tenantId;

    const isTenantStaff = (authContext?.tenants ?? []).some(
      (membership) =>
        membership.tenantId === tenantId &&
        ["tenant_admin", "tenant_staff"].includes(membership.role)
    );

    if (!(authContext?.scopes?.isPlatformStaff || isTenantStaff)) {
      return res.status(403).json({ error: "Tenant staff scope denied" });
    }

    return res.json(updateTenantSettings(tenantId, req.body ?? {}));
  });

  app.patch("/inventory/settings/threshold", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId;

    const isTenantStaff = (authContext?.tenants ?? []).some(
      (membership) =>
        membership.tenantId === tenantId &&
        ["tenant_admin", "tenant_staff"].includes(membership.role)
    );

    if (!(authContext?.scopes?.isPlatformStaff || isTenantStaff)) {
      return res.status(403).json({ error: "Tenant staff scope denied" });
    }

    return res.json(setLowStockThreshold(tenantId, req.body.threshold));
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "inventory-service";
  const app = createApp(serviceName);
  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
