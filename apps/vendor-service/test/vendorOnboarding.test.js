import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

const tenantAdminContext = {
  user: { id: "tenant-admin-user" },
  scopes: { isPlatformStaff: false },
  tenants: [{ tenantId: "11111111-1111-1111-1111-111111111111", role: "tenant_admin" }],
  vendors: []
};

test("tenant admin can onboard vendor and invite vendor user", async () => {
  const app = createApp("vendor-service-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();

  const createResponse = await fetch(`http://127.0.0.1:${port}/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantAdminContext)
    },
    body: JSON.stringify({
      tenantId: "11111111-1111-1111-1111-111111111111",
      code: "VEN-Z",
      name: "Zulu Parts"
    })
  });
  const vendor = await createResponse.json();

  const inviteResponse = await fetch(`http://127.0.0.1:${port}/vendors/${vendor.id}/memberships`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantAdminContext)
    },
    body: JSON.stringify({ appUserId: "user-vendor-z", role: "vendor_staff" })
  });

  server.close();

  assert.equal(createResponse.status, 201);
  assert.equal(inviteResponse.status, 201);
});

test("vendor user cannot access another vendor details", async () => {
  const app = createApp("vendor-service-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(
    `http://127.0.0.1:${port}/vendors/44444444-4444-4444-4444-444444444442`,
    {
      headers: {
        "x-auth-context": JSON.stringify({
          user: { id: "vendor-a-user" },
          scopes: { isPlatformStaff: false },
          tenants: [],
          vendors: [
            {
              tenantId: "11111111-1111-1111-1111-111111111111",
              vendorId: "44444444-4444-4444-4444-444444444441",
              role: "vendor_admin"
            }
          ]
        })
      }
    }
  );

  server.close();

  assert.equal(response.status, 403);
});
