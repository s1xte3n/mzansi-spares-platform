import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { __resetCatalogState } from "../src/store.js";

const tenantId = "11111111-1111-1111-1111-111111111111";
const vendorId = "44444444-4444-4444-4444-444444444441";

const vendorAdminContext = {
  user: { id: "vendor-admin" },
  scopes: { isPlatformStaff: false },
  tenants: [],
  vendors: [{ tenantId, vendorId, role: "vendor_admin" }]
};

const tenantReviewerContext = {
  user: { id: "tenant-reviewer" },
  scopes: { isPlatformStaff: false },
  tenants: [{ tenantId, role: "tenant_staff" }],
  vendors: []
};

beforeEach(() => {
  __resetCatalogState();
});

test("moderation flow: draft -> pending_review -> approved", async () => {
  const app = createApp("catalog-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const productRes = await fetch(`http://127.0.0.1:${port}/catalog/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorAdminContext)
    },
    body: JSON.stringify({
      tenantId,
      vendorId,
      categoryId: "cat-brakes",
      title: "Brake Pad",
      sku: "PAD-001",
      oemCode: "OEM1",
      aftermarketCode: "AM1"
    })
  });
  const product = await productRes.json();

  const submitRes = await fetch(
    `http://127.0.0.1:${port}/catalog/products/${product.id}/submit-review`,
    {
      method: "POST",
      headers: { "x-auth-context": JSON.stringify(vendorAdminContext) }
    }
  );

  const approveRes = await fetch(
    `http://127.0.0.1:${port}/catalog/products/${product.id}/moderate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(tenantReviewerContext)
      },
      body: JSON.stringify({ moderationState: "approved" })
    }
  );
  const approved = await approveRes.json();

  server.close();

  assert.equal(productRes.status, 201);
  assert.equal(submitRes.status, 200);
  assert.equal(approveRes.status, 200);
  assert.equal(approved.moderationState, "approved");
});

test("fitment linkage on variant", async () => {
  const app = createApp("catalog-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const productRes = await fetch(`http://127.0.0.1:${port}/catalog/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorAdminContext)
    },
    body: JSON.stringify({
      tenantId,
      vendorId,
      categoryId: "cat-brakes",
      title: "Disc",
      sku: "DISC-001"
    })
  });
  const product = await productRes.json();

  const variantRes = await fetch(
    `http://127.0.0.1:${port}/catalog/products/${product.id}/variants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(vendorAdminContext)
      },
      body: JSON.stringify({ sku: "DISC-001-A", oemCode: "OEM2", aftermarketCode: "AM2" })
    }
  );
  const variant = await variantRes.json();

  const fitmentRes = await fetch(
    `http://127.0.0.1:${port}/catalog/variants/${variant.id}/fitments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        makeId: "make-toyota",
        modelId: "model-hilux",
        derivativeId: "deriv-hilux-gd6",
        yearFrom: 2016,
        yearTo: 2024
      })
    }
  );
  const fitmentPayload = await fitmentRes.json();

  server.close();

  assert.equal(fitmentRes.status, 201);
  assert.equal(fitmentPayload.fitments.length, 1);
  assert.equal(fitmentPayload.fitment.variantId, variant.id);
});

test("fitment master data edits are reflected in subsequent reads and search", async () => {
  const app = createApp("catalog-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const createMakeRes = await fetch(`http://127.0.0.1:${port}/catalog/reference/vehicle-makes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantReviewerContext)
    },
    body: JSON.stringify({ tenantId, code: "FORD", name: "Ford" })
  });
  const make = await createMakeRes.json();

  const createModelRes = await fetch(`http://127.0.0.1:${port}/catalog/reference/vehicle-models`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantReviewerContext)
    },
    body: JSON.stringify({ tenantId, makeId: make.id, code: "RANGER", name: "Ranger" })
  });
  const model = await createModelRes.json();

  const derivativeRes = await fetch(
    `http://127.0.0.1:${port}/catalog/reference/vehicle-derivatives`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(tenantReviewerContext)
      },
      body: JSON.stringify({
        tenantId,
        modelId: model.id,
        code: "RAPTOR",
        name: "Raptor",
        yearFrom: 2022,
        yearTo: 2026
      })
    }
  );

  const renameMakeRes = await fetch(
    `http://127.0.0.1:${port}/catalog/reference/vehicle-makes/${make.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(tenantReviewerContext)
      },
      body: JSON.stringify({ tenantId, name: "Ford Updated" })
    }
  );

  const brandRes = await fetch(`http://127.0.0.1:${port}/catalog/reference/part-brands`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantReviewerContext)
    },
    body: JSON.stringify({ tenantId, code: "MANN", name: "Mann Filter" })
  });

  const vehiclesSearchRes = await fetch(
    `http://127.0.0.1:${port}/catalog/reference/vehicles?tenantId=${tenantId}&q=updated`,
    {
      headers: { "x-auth-context": JSON.stringify(tenantReviewerContext) }
    }
  );
  const vehiclesPayload = await vehiclesSearchRes.json();

  const brandSearchRes = await fetch(
    `http://127.0.0.1:${port}/catalog/reference/part-brands?tenantId=${tenantId}&q=mann`,
    {
      headers: { "x-auth-context": JSON.stringify(tenantReviewerContext) }
    }
  );
  const brandPayload = await brandSearchRes.json();

  server.close();

  assert.equal(createMakeRes.status, 201);
  assert.equal(createModelRes.status, 201);
  assert.equal(derivativeRes.status, 201);
  assert.equal(renameMakeRes.status, 200);
  assert.equal(brandRes.status, 201);
  assert.equal(vehiclesPayload.makes.length, 1);
  assert.equal(vehiclesPayload.makes[0].name, "Ford Updated");
  assert.equal(brandPayload.length, 1);
  assert.equal(brandPayload[0].name, "Mann Filter");
});

test("role restrictions: vendor cannot moderate products", async () => {
  const app = createApp("catalog-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const productRes = await fetch(`http://127.0.0.1:${port}/catalog/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(vendorAdminContext)
    },
    body: JSON.stringify({
      tenantId,
      vendorId,
      categoryId: "cat-brakes",
      title: "Pad",
      sku: "PAD-002"
    })
  });
  const product = await productRes.json();

  const deniedRes = await fetch(
    `http://127.0.0.1:${port}/catalog/products/${product.id}/moderate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(vendorAdminContext)
      },
      body: JSON.stringify({ moderationState: "approved" })
    }
  );

  server.close();

  assert.equal(deniedRes.status, 403);
});
