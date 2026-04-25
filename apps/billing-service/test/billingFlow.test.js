import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

const tenantId = "11111111-1111-1111-1111-111111111111";
const tenantAdminContext = {
  user: { id: "tenant-admin" },
  scopes: { isPlatformStaff: false },
  tenants: [{ tenantId, role: "tenant_admin" }],
  vendors: []
};

test("webhook idempotency prevents duplicate processing", async () => {
  const syncCalls = [];
  const app = createApp("billing-test", {
    tenantSync: async (payload) => {
      syncCalls.push(payload);
    }
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const eventPayload = {
    id: "evt_1",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_1",
        customer: "cus_1",
        status: "active",
        metadata: { tenantId },
        items: { data: [{ price: { id: "price_basic" } }] }
      }
    }
  };

  const first = await fetch(`http://127.0.0.1:${port}/billing/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload)
  });

  const second = await fetch(`http://127.0.0.1:${port}/billing/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventPayload)
  });

  const secondPayload = await second.json();
  server.close();

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(secondPayload.duplicate, true);
  assert.equal(syncCalls.length, 1);
});

test("subscription webhook updates tenant billing state via sync", async () => {
  let latestPayload = null;
  const app = createApp("billing-test", {
    tenantSync: async (payload) => {
      latestPayload = payload;
    }
  });

  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const webhook = await fetch(`http://127.0.0.1:${port}/billing/webhooks/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "evt_2",
      type: "customer.subscription.created",
      data: {
        object: {
          id: "sub_2",
          customer: "cus_2",
          status: "trialing",
          metadata: { tenantId },
          items: { data: [{ price: { id: "price_pro" } }] }
        }
      }
    })
  });

  server.close();

  assert.equal(webhook.status, 200);
  assert.equal(latestPayload.tenantId, tenantId);
  assert.equal(latestPayload.state.subscriptionStatus, "trialing");
  assert.equal(latestPayload.state.subscriptionPlan, "price_pro");
});

test("tenant admin can create checkout session for SaaS subscription", async () => {
  const app = createApp("billing-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/billing/checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantAdminContext)
    },
    body: JSON.stringify({ tenantId, planCode: "price_basic" })
  });

  const payload = await response.json();
  server.close();

  assert.equal(response.status, 201);
  assert.equal(payload.mode, "subscription");
});
