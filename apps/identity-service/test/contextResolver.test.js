import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuthorizationContext } from "../src/contextResolver.js";

const repository = {
  async getAppUserByClerkId(clerkUserId) {
    if (clerkUserId === "tenant-user") {
      return { id: "u1", clerkUserId: "tenant-user", isPlatformStaff: false };
    }

    if (clerkUserId === "vendor-user") {
      return { id: "u2", clerkUserId: "vendor-user", isPlatformStaff: false };
    }

    return null;
  },
  async getTenantMemberships(userId) {
    if (userId === "u1") {
      return [{ tenantId: "t1", role: "tenant_admin" }];
    }

    return [];
  },
  async getVendorMemberships(userId) {
    if (userId === "u2") {
      return [{ tenantId: "t1", vendorId: "v1", role: "vendor_admin" }];
    }

    return [];
  }
};

test("tenant user can resolve own tenant context", async () => {
  const context = await resolveAuthorizationContext(
    { clerkUserId: "tenant-user", requestedTenantId: "t1" },
    repository
  );

  assert.ok(context);
  assert.equal(context.activeTenantId, "t1");
});

test("tenant user is blocked from another tenant", async () => {
  const context = await resolveAuthorizationContext(
    { clerkUserId: "tenant-user", requestedTenantId: "t2" },
    repository
  );

  assert.equal(context, null);
});

test("vendor user is limited to vendor scope", async () => {
  const allowed = await resolveAuthorizationContext(
    { clerkUserId: "vendor-user", requestedVendorId: "v1" },
    repository
  );
  const denied = await resolveAuthorizationContext(
    { clerkUserId: "vendor-user", requestedVendorId: "v2" },
    repository
  );

  assert.ok(allowed);
  assert.equal(denied, null);
});
