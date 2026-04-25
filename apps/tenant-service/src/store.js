import pg from "pg";

const DEFAULT_BILLING = {
  subscriptionStatus: "inactive",
  subscriptionPlan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null
};

const memory = {
  tenants: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      slug: "demo-spares",
      name: "Demo Spares SA",
      status: "active",
      currencyCode: "ZAR",
      countryCode: "ZA",
      ...DEFAULT_BILLING
    }
  ],
  memberships: [
    {
      id: "tm-1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      appUserId: "u-tenant-admin",
      role: "tenant_admin"
    }
  ],
  auditLogs: []
};

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function hydrateTenant(tenant) {
  return {
    ...tenant,
    ...DEFAULT_BILLING
  };
}

export async function listTenants() {
  if (!pool) {
    return memory.tenants;
  }

  const result = await pool.query(
    `SELECT id, slug, name, status, currency_code AS "currencyCode", country_code AS "countryCode"
     FROM tenant
     ORDER BY name ASC`
  );

  const tenants = result.rows;
  for (const tenant of tenants) {
    const billing = await getTenantBilling(tenant.id);
    Object.assign(tenant, billing);
  }

  return tenants;
}

export async function getTenant(tenantId) {
  if (!pool) {
    return memory.tenants.find((tenant) => tenant.id === tenantId) ?? null;
  }

  const result = await pool.query(
    `SELECT id, slug, name, status, currency_code AS "currencyCode", country_code AS "countryCode"
     FROM tenant
     WHERE id = $1`,
    [tenantId]
  );

  const tenant = result.rows[0] ?? null;
  if (!tenant) {
    return null;
  }

  return {
    ...tenant,
    ...(await getTenantBilling(tenantId))
  };
}

export async function createTenant(input) {
  if (!pool) {
    const tenant = {
      id: id("tenant"),
      slug: input.slug,
      name: input.name,
      status: "active",
      currencyCode: input.currencyCode ?? "ZAR",
      countryCode: input.countryCode ?? "ZA",
      ...DEFAULT_BILLING
    };
    memory.tenants.push(tenant);
    return tenant;
  }

  const result = await pool.query(
    `INSERT INTO tenant (slug, name, status, currency_code, country_code)
     VALUES ($1, $2, 'active', $3, $4)
     RETURNING id, slug, name, status, currency_code AS "currencyCode", country_code AS "countryCode"`,
    [input.slug, input.name, input.currencyCode ?? "ZAR", input.countryCode ?? "ZA"]
  );

  return hydrateTenant(result.rows[0]);
}

export async function updateTenant(tenantId, patch) {
  if (!pool) {
    const tenant = memory.tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      return null;
    }

    Object.assign(tenant, patch);
    return tenant;
  }

  const result = await pool.query(
    `UPDATE tenant
     SET name = COALESCE($2, name),
         status = COALESCE($3, status),
         updated_at = now()
     WHERE id = $1
     RETURNING id, slug, name, status, currency_code AS "currencyCode", country_code AS "countryCode"`,
    [tenantId, patch.name ?? null, patch.status ?? null]
  );

  const tenant = result.rows[0] ?? null;
  if (!tenant) {
    return null;
  }

  return {
    ...tenant,
    ...(await getTenantBilling(tenantId))
  };
}

export async function getTenantBilling(tenantId) {
  if (!pool) {
    const tenant = memory.tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      return null;
    }

    return {
      subscriptionStatus: tenant.subscriptionStatus,
      subscriptionPlan: tenant.subscriptionPlan,
      stripeCustomerId: tenant.stripeCustomerId,
      stripeSubscriptionId: tenant.stripeSubscriptionId
    };
  }

  const result = await pool.query(
    `SELECT setting_key, value_json
     FROM tenant_setting
     WHERE tenant_id = $1 AND setting_key = 'billing.subscription'`,
    [tenantId]
  );

  if (!result.rows[0]) {
    return { ...DEFAULT_BILLING };
  }

  return {
    ...DEFAULT_BILLING,
    ...result.rows[0].value_json
  };
}

export async function upsertTenantBilling(tenantId, patch, updatedByUserId = null) {
  if (!pool) {
    const tenant = memory.tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      return null;
    }

    Object.assign(tenant, patch);
    return getTenantBilling(tenantId);
  }

  const next = {
    ...(await getTenantBilling(tenantId)),
    ...patch
  };

  await pool.query(
    `INSERT INTO tenant_setting (tenant_id, setting_key, value_json, updated_by_user_id)
     VALUES ($1, 'billing.subscription', $2::jsonb, $3)
     ON CONFLICT (tenant_id, setting_key)
     DO UPDATE SET value_json = EXCLUDED.value_json,
                   updated_by_user_id = EXCLUDED.updated_by_user_id,
                   updated_at = now()`,
    [tenantId, JSON.stringify(next), updatedByUserId]
  );

  return next;
}

export async function listMemberships(tenantId) {
  if (!pool) {
    return memory.memberships.filter((membership) => membership.tenantId === tenantId);
  }

  const result = await pool.query(
    `SELECT id, tenant_id AS "tenantId", app_user_id AS "appUserId", role
     FROM tenant_membership
     WHERE tenant_id = $1`,
    [tenantId]
  );

  return result.rows;
}

export async function createMembership(tenantId, input) {
  if (!pool) {
    const membership = {
      id: id("tm"),
      tenantId,
      appUserId: input.appUserId,
      role: input.role
    };
    memory.memberships.push(membership);
    return membership;
  }

  const result = await pool.query(
    `INSERT INTO tenant_membership (tenant_id, app_user_id, role)
     VALUES ($1, $2, $3)
     RETURNING id, tenant_id AS "tenantId", app_user_id AS "appUserId", role`,
    [tenantId, input.appUserId, input.role]
  );

  return result.rows[0];
}

export async function writeAuditLog(entry) {
  if (!pool) {
    memory.auditLogs.push({ id: id("audit"), ...entry });
    return;
  }

  await pool.query(
    `INSERT INTO audit_log (tenant_id, actor_user_id, entity_type, entity_id, action, payload_json)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [
      entry.tenantId ?? null,
      entry.actorUserId ?? null,
      entry.entityType,
      entry.entityId ?? null,
      entry.action,
      JSON.stringify(entry.payload ?? {})
    ]
  );
}
