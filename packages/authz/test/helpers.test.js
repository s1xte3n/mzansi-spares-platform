import test from "node:test";
import assert from "node:assert/strict";
import { requireTenantAccess, requireVendorAccess } from "../src/index.js";

const context = {
  tenants: [{ tenantId: "t1", role: "tenant_admin" }],
  vendors: [{ tenantId: "t1", vendorId: "v1", role: "vendor_admin" }]
};

test("requireTenantAccess throws on wrong tenant", () => {
  assert.throws(() => requireTenantAccess(context, "t2"));
});

test("requireVendorAccess throws on wrong vendor", () => {
  assert.throws(() => requireVendorAccess(context, "v2"));
});
