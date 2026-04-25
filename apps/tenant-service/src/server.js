import express from "express";
import { fileURLToPath } from "node:url";
import {
  createMembership,
  createTenant,
  getTenant,
  listMemberships,
  listTenants,
  updateTenant,
  writeAuditLog,
  getTenantBilling,
  upsertTenantBilling
} from "./store.js";

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function isPlatformStaff(authContext) {
  return Boolean(authContext?.scopes?.isPlatformStaff);
}

function canManageTenant(authContext, tenantId) {
  if (isPlatformStaff(authContext)) {
    return true;
  }

  return (authContext?.tenants ?? []).some(
    (membership) => membership.tenantId === tenantId && membership.role === "tenant_admin"
  );
}

function hasTenantReadScope(authContext, tenantId) {
  return (
    isPlatformStaff(authContext) ||
    (authContext?.tenants ?? []).some((membership) => membership.tenantId === tenantId)
  );
}

function isInternalCall(req) {
  const token = req.header("x-internal-token");
  return token && token === (process.env.INTERNAL_SERVICE_TOKEN || "dev-internal-token");
}

export function createApp(serviceName = process.env.SERVICE_NAME || "tenant-service") {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res
      .status(200)
      .json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
  });

  app.get("/tenants", async (req, res) => {
    const authContext = parseAuthContext(req);

    if (isPlatformStaff(authContext)) {
      return res.json(await listTenants());
    }

    const tenantIds = new Set((authContext.tenants ?? []).map((m) => m.tenantId));
    const tenants = (await listTenants()).filter((tenant) => tenantIds.has(tenant.id));
    return res.json(tenants);
  });

  app.post("/tenants", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!isPlatformStaff(authContext)) {
      return res.status(403).json({ error: "Only platform staff can create tenants" });
    }

    const tenant = await createTenant(req.body);
    await writeAuditLog({
      tenantId: tenant.id,
      actorUserId: authContext?.user?.id,
      entityType: "tenant",
      entityId: tenant.id,
      action: "tenant.create",
      payload: req.body
    });

    return res.status(201).json(tenant);
  });

  app.get("/tenants/:tenantId", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!canManageTenant(authContext, req.params.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const tenant = await getTenant(req.params.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    return res.json({ tenant, memberships: await listMemberships(req.params.tenantId) });
  });

  app.patch("/tenants/:tenantId", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!canManageTenant(authContext, req.params.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const tenant = await updateTenant(req.params.tenantId, req.body);
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await writeAuditLog({
      tenantId: tenant.id,
      actorUserId: authContext?.user?.id,
      entityType: "tenant",
      entityId: tenant.id,
      action: tenant.status === "suspended" ? "tenant.suspend" : "tenant.update",
      payload: req.body
    });

    return res.json(tenant);
  });

  app.get("/tenants/:tenantId/billing", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!hasTenantReadScope(authContext, req.params.tenantId) && !isInternalCall(req)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const billing = await getTenantBilling(req.params.tenantId);
    if (!billing) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    return res.json(billing);
  });

  app.patch("/tenants/:tenantId/billing", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!canManageTenant(authContext, req.params.tenantId) && !isInternalCall(req)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const billing = await upsertTenantBilling(
      req.params.tenantId,
      req.body,
      authContext?.user?.id ?? null
    );
    if (!billing) {
      return res.status(404).json({ error: "Tenant not found" });
    }

    await writeAuditLog({
      tenantId: req.params.tenantId,
      actorUserId: authContext?.user?.id ?? "internal-service",
      entityType: "tenant_billing",
      entityId: req.params.tenantId,
      action: "tenant.billing.update",
      payload: req.body
    });

    return res.json(billing);
  });

  app.post("/tenants/:tenantId/memberships", async (req, res) => {
    const authContext = parseAuthContext(req);
    if (!canManageTenant(authContext, req.params.tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const membership = await createMembership(req.params.tenantId, req.body);
    await writeAuditLog({
      tenantId: req.params.tenantId,
      actorUserId: authContext?.user?.id,
      entityType: "tenant_membership",
      entityId: membership.id,
      action: "tenant_membership.invite",
      payload: req.body
    });

    return res.status(201).json(membership);
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "tenant-service";
  const app = createApp(serviceName);
  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
