import pg from "pg";

const memory = {
  vendors: [
    {
      id: "44444444-4444-4444-4444-444444444441",
      tenantId: "11111111-1111-1111-1111-111111111111",
      code: "VEN-A",
      name: "Alpha Auto Supplies",
      status: "active"
    }
  ],
  memberships: [
    {
      id: "vm-1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      vendorId: "44444444-4444-4444-4444-444444444441",
      appUserId: "u-vendor-a",
      role: "vendor_admin"
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

export async function listVendors(tenantId) {
  if (!pool) {
    return memory.vendors.filter((vendor) => vendor.tenantId === tenantId);
  }

  const result = await pool.query(
    `SELECT id, tenant_id AS "tenantId", code, name, status
     FROM vendor
     WHERE tenant_id = $1
     ORDER BY name ASC`,
    [tenantId]
  );

  return result.rows;
}

export async function getVendor(vendorId) {
  if (!pool) {
    return memory.vendors.find((vendor) => vendor.id === vendorId) ?? null;
  }

  const result = await pool.query(
    `SELECT id, tenant_id AS "tenantId", code, name, status
     FROM vendor
     WHERE id = $1`,
    [vendorId]
  );

  return result.rows[0] ?? null;
}

export async function createVendor(input) {
  if (!pool) {
    const vendor = {
      id: id("vendor"),
      tenantId: input.tenantId,
      code: input.code,
      name: input.name,
      status: "active"
    };
    memory.vendors.push(vendor);
    return vendor;
  }

  const result = await pool.query(
    `INSERT INTO vendor (tenant_id, code, name, status)
     VALUES ($1, $2, $3, 'active')
     RETURNING id, tenant_id AS "tenantId", code, name, status`,
    [input.tenantId, input.code, input.name]
  );

  return result.rows[0];
}

export async function updateVendor(vendorId, patch) {
  if (!pool) {
    const vendor = memory.vendors.find((item) => item.id === vendorId);
    if (!vendor) {
      return null;
    }
    Object.assign(vendor, patch);
    return vendor;
  }

  const result = await pool.query(
    `UPDATE vendor
     SET name = COALESCE($2, name),
         status = COALESCE($3, status),
         updated_at = now()
     WHERE id = $1
     RETURNING id, tenant_id AS "tenantId", code, name, status`,
    [vendorId, patch.name ?? null, patch.status ?? null]
  );

  return result.rows[0] ?? null;
}

export async function listVendorMemberships(vendorId) {
  if (!pool) {
    return memory.memberships.filter((membership) => membership.vendorId === vendorId);
  }

  const result = await pool.query(
    `SELECT id, tenant_id AS "tenantId", vendor_id AS "vendorId", app_user_id AS "appUserId", role
     FROM vendor_user_membership
     WHERE vendor_id = $1`,
    [vendorId]
  );

  return result.rows;
}

export async function createVendorMembership(vendorId, input) {
  if (!pool) {
    const membership = {
      id: id("vm"),
      vendorId,
      tenantId: input.tenantId,
      appUserId: input.appUserId,
      role: input.role
    };
    memory.memberships.push(membership);
    return membership;
  }

  const result = await pool.query(
    `INSERT INTO vendor_user_membership (tenant_id, vendor_id, app_user_id, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, tenant_id AS "tenantId", vendor_id AS "vendorId", app_user_id AS "appUserId", role`,
    [input.tenantId, vendorId, input.appUserId, input.role]
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
