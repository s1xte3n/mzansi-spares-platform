import express from "express";
import { fileURLToPath } from "node:url";
import {
  createVendor,
  createVendorMembership,
  getVendor,
  listVendorMemberships,
  listVendors,
  updateVendor,
  writeAuditLog
} from "./store.js";

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function canManageTenant(authContext, tenantId) {
  if (authContext?.scopes?.isPlatformStaff) {
    return true;
  }

  return (authContext?.tenants ?? []).some(
    (membership) => membership.tenantId === tenantId && membership.role === "tenant_admin"
  );
}

function canSeeVendor(authContext, vendorId) {
  if (authContext?.scopes?.isPlatformStaff) {
    return true;
  }

  return (authContext?.vendors ?? []).some((membership) => membership.vendorId === vendorId);
}

export function createApp(serviceName = process.env.SERVICE_NAME || "vendor-service") {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res
      .status(200)
      .json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
  });

  app.get("/vendors", async (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.header("x-tenant-id") || authContext.activeTenantId;

    if (!tenantId || !canManageTenant(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(await listVendors(tenantId));
  });

  app.post("/vendors", async (req, res) => {
    const authContext = parseAuthContext(req);

    if (!canManageTenant(authContext, req.body.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const vendor = await createVendor(req.body);
    await writeAuditLog({
      tenantId: vendor.tenantId,
      actorUserId: authContext?.user?.id,
      entityType: "vendor",
      entityId: vendor.id,
      action: "vendor.create",
      payload: req.body
    });

    return res.status(201).json(vendor);
  });

  app.get("/vendors/:vendorId", async (req, res) => {
    const authContext = parseAuthContext(req);

    if (!canSeeVendor(authContext, req.params.vendorId) && !authContext?.scopes?.isPlatformStaff) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    const vendor = await getVendor(req.params.vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!canManageTenant(authContext, vendor.tenantId) && !canSeeVendor(authContext, vendor.id)) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    return res.json({ vendor, memberships: await listVendorMemberships(vendor.id) });
  });

  app.patch("/vendors/:vendorId", async (req, res) => {
    const authContext = parseAuthContext(req);
    const existing = await getVendor(req.params.vendorId);

    if (!existing) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!canManageTenant(authContext, existing.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const vendor = await updateVendor(req.params.vendorId, req.body);
    await writeAuditLog({
      tenantId: vendor.tenantId,
      actorUserId: authContext?.user?.id,
      entityType: "vendor",
      entityId: vendor.id,
      action: vendor.status === "suspended" ? "vendor.suspend" : "vendor.update",
      payload: req.body
    });

    return res.json(vendor);
  });

  app.post("/vendors/:vendorId/memberships", async (req, res) => {
    const authContext = parseAuthContext(req);
    const vendor = await getVendor(req.params.vendorId);

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!canManageTenant(authContext, vendor.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const membership = await createVendorMembership(req.params.vendorId, {
      ...req.body,
      tenantId: vendor.tenantId
    });

    await writeAuditLog({
      tenantId: vendor.tenantId,
      actorUserId: authContext?.user?.id,
      entityType: "vendor_membership",
      entityId: membership.id,
      action: "vendor_membership.invite",
      payload: req.body
    });

    return res.status(201).json(membership);
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "vendor-service";
  const app = createApp(serviceName);
  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
