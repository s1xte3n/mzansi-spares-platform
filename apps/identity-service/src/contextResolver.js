import pg from "pg";

const mockData = {
  users: [
    {
      id: "u-platform",
      clerkUserId: "clerk_platform_admin_1",
      email: "platform.admin@demo.local",
      fullName: "Platform Admin",
      isPlatformStaff: true
    },
    {
      id: "u-tenant",
      clerkUserId: "clerk_tenant_admin_1",
      email: "tenant.admin@demo.local",
      fullName: "Tenant Admin",
      isPlatformStaff: false
    },
    {
      id: "u-vendor-a",
      clerkUserId: "clerk_vendor_a_1",
      email: "vendor.a@demo.local",
      fullName: "Vendor A",
      isPlatformStaff: false
    }
  ],
  tenantMemberships: [
    { userId: "u-tenant", tenantId: "11111111-1111-1111-1111-111111111111", role: "tenant_admin" }
  ],
  vendorMemberships: [
    {
      userId: "u-vendor-a",
      tenantId: "11111111-1111-1111-1111-111111111111",
      vendorId: "44444444-4444-4444-4444-444444444441",
      role: "vendor_admin"
    }
  ]
};

function createRepository() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return {
      async getAppUserByClerkId(clerkUserId) {
        return mockData.users.find((user) => user.clerkUserId === clerkUserId) ?? null;
      },
      async getTenantMemberships(userId) {
        return mockData.tenantMemberships.filter((membership) => membership.userId === userId);
      },
      async getVendorMemberships(userId) {
        return mockData.vendorMemberships.filter((membership) => membership.userId === userId);
      }
    };
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });

  return {
    async getAppUserByClerkId(clerkUserId) {
      const result = await pool.query(
        `SELECT id, clerk_user_id AS "clerkUserId", email, full_name AS "fullName", is_platform_staff AS "isPlatformStaff"
         FROM app_user
         WHERE clerk_user_id = $1`,
        [clerkUserId]
      );

      return result.rows[0] ?? null;
    },
    async getTenantMemberships(userId) {
      const result = await pool.query(
        `SELECT tenant_id AS "tenantId", role
         FROM tenant_membership
         WHERE app_user_id = $1`,
        [userId]
      );

      return result.rows;
    },
    async getVendorMemberships(userId) {
      const result = await pool.query(
        `SELECT tenant_id AS "tenantId", vendor_id AS "vendorId", role
         FROM vendor_user_membership
         WHERE app_user_id = $1`,
        [userId]
      );

      return result.rows;
    }
  };
}

export async function resolveAuthorizationContext(input, repository = createRepository()) {
  const { clerkUserId, requestedTenantId, requestedVendorId } = input;

  const user = await repository.getAppUserByClerkId(clerkUserId);

  if (!user) {
    return null;
  }

  const tenants = await repository.getTenantMemberships(user.id);
  const vendors = await repository.getVendorMemberships(user.id);

  const activeTenantId = requestedTenantId ?? tenants[0]?.tenantId ?? vendors[0]?.tenantId ?? null;
  const activeVendorId = requestedVendorId ?? null;

  if (requestedTenantId && !user.isPlatformStaff) {
    const tenantAllowed =
      tenants.some((membership) => membership.tenantId === requestedTenantId) ||
      vendors.some((membership) => membership.tenantId === requestedTenantId);

    if (!tenantAllowed) {
      return null;
    }
  }

  if (requestedVendorId) {
    const vendorAllowed = vendors.some((membership) => membership.vendorId === requestedVendorId);

    if (!vendorAllowed) {
      return null;
    }
  }

  return {
    user,
    tenants,
    vendors,
    activeTenantId,
    activeVendorId,
    scopes: {
      isPlatformStaff: user.isPlatformStaff,
      tenantIds: [
        ...new Set([
          ...tenants.map((membership) => membership.tenantId),
          ...vendors.map((membership) => membership.tenantId)
        ])
      ],
      vendorIds: [...new Set(vendors.map((membership) => membership.vendorId))]
    }
  };
}
