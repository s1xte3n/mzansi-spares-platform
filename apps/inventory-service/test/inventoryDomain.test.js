import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { __resetInventoryState } from "../src/store.js";

const tenantId = "11111111-1111-1111-1111-111111111111";
const vendorId = "44444444-4444-4444-4444-444444444441";
const variantId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1";

const vendorContext = {
  user: { id: "vendor-admin" },
  scopes: { isPlatformStaff: false },
  tenants: [],
  vendors: [{ tenantId, vendorId, role: "vendor_admin" }]
};

const tenantStaffContext = {
  user: { id: "tenant-admin" },
  scopes: { isPlatformStaff: false },
  tenants: [{ tenantId, role: "tenant_admin" }],
  vendors: []
};

beforeEach(() => {
  __resetInventoryState();
});

test("available stock = stock_on_hand - reserved_stock", async () => {
  const app = createApp("inventory-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const detailRes = await fetch(`http://127.0.0.1:${port}/inventory/variants/${variantId}`, {
    headers: { "x-tenant-id": tenantId }
  });
  const detail = await detailRes.json();

  server.close();

  assert.equal(detail.stockOnHand - detail.reservedStock, detail.availableStock);
});

test("reservations and releases update reserved and available stock", async () => {
  const app = createApp("inventory-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const reserveRes = await fetch(`http://127.0.0.1:${port}/inventory/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorContext)
    },
    body: JSON.stringify({ tenantId, vendorId, variantId, quantity: 2, reference: "ord-1" })
  });

  const releaseRes = await fetch(`http://127.0.0.1:${port}/inventory/releases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorContext)
    },
    body: JSON.stringify({ tenantId, vendorId, variantId, quantity: 1, reference: "ord-1" })
  });

  const detailRes = await fetch(`http://127.0.0.1:${port}/inventory/variants/${variantId}`, {
    headers: { "x-tenant-id": tenantId }
  });
  const detail = await detailRes.json();

  server.close();

  assert.equal(reserveRes.status, 201);
  assert.equal(releaseRes.status, 201);
  assert.ok(detail.reservedStock >= 1);
  assert.equal(detail.stockOnHand - detail.reservedStock, detail.availableStock);
});

test("invalid negative states are rejected", async () => {
  const app = createApp("inventory-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const failReserveRes = await fetch(`http://127.0.0.1:${port}/inventory/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorContext)
    },
    body: JSON.stringify({ tenantId, vendorId, variantId, quantity: 99999, reference: "ord-2" })
  });

  const failReleaseRes = await fetch(`http://127.0.0.1:${port}/inventory/releases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorContext)
    },
    body: JSON.stringify({ tenantId, vendorId, variantId, quantity: 99999, reference: "ord-2" })
  });

  server.close();

  assert.equal(failReserveRes.status, 400);
  assert.equal(failReleaseRes.status, 400);
});

test("settings changes take effect immediately without restart", async () => {
  const app = createApp("inventory-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const initialLowStockRes = await fetch(`http://127.0.0.1:${port}/inventory/low-stock`, {
    headers: {
      "x-auth-context": JSON.stringify(tenantStaffContext),
      "x-tenant-id": tenantId
    }
  });

  const patchRes = await fetch(`http://127.0.0.1:${port}/inventory/settings/${tenantId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantStaffContext)
    },
    body: JSON.stringify({ lowStockThreshold: 25, supportedProvinces: ["Gauteng", "Limpopo"] })
  });

  const updatedLowStockRes = await fetch(`http://127.0.0.1:${port}/inventory/low-stock`, {
    headers: {
      "x-auth-context": JSON.stringify(tenantStaffContext),
      "x-tenant-id": tenantId
    }
  });

  const settingsRes = await fetch(`http://127.0.0.1:${port}/inventory/settings/${tenantId}`, {
    headers: { "x-auth-context": JSON.stringify(tenantStaffContext) }
  });

  const initialPayload = await initialLowStockRes.json();
  const updatedPayload = await updatedLowStockRes.json();
  const settingsPayload = await settingsRes.json();

  server.close();

  assert.equal(initialPayload.threshold, 5);
  assert.equal(patchRes.status, 200);
  assert.equal(updatedPayload.threshold, 25);
  assert.equal(updatedPayload.records.length, 1);
  assert.deepEqual(settingsPayload.supportedProvinces, ["Gauteng", "Limpopo"]);
});
