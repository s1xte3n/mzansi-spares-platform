import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

const platformContext = {
  user: { id: "platform-user" },
  scopes: { isPlatformStaff: true },
  tenants: []
};

test("platform staff can create tenant", async () => {
  const app = createApp("tenant-service-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/tenants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(platformContext)
    },
    body: JSON.stringify({ slug: "tenant-test", name: "Tenant Test" })
  });

  const payload = await response.json();
  server.close();

  assert.equal(response.status, 201);
  assert.equal(payload.slug, "tenant-test");
});

test("billing state can be synced via internal token", async () => {
  const app = createApp("tenant-service-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const patchRes = await fetch(
    `http://127.0.0.1:${port}/tenants/11111111-1111-1111-1111-111111111111/billing`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": "dev-internal-token"
      },
      body: JSON.stringify({ subscriptionStatus: "active", subscriptionPlan: "price_basic" })
    }
  );

  const readRes = await fetch(
    `http://127.0.0.1:${port}/tenants/11111111-1111-1111-1111-111111111111/billing`,
    {
      headers: {
        "x-auth-context": JSON.stringify({
          user: { id: "tenant-admin" },
          scopes: { isPlatformStaff: false },
          tenants: [{ tenantId: "11111111-1111-1111-1111-111111111111", role: "tenant_admin" }]
        })
      }
    }
  );

  const billing = await readRes.json();
  server.close();

  assert.equal(patchRes.status, 200);
  assert.equal(readRes.status, 200);
  assert.equal(billing.subscriptionStatus, "active");
});
