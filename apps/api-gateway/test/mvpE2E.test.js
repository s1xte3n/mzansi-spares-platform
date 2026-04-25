import test from "node:test";
import assert from "node:assert/strict";
import { createApp as createTenantApp } from "../../tenant-service/src/server.js";
import { createApp as createVendorApp } from "../../vendor-service/src/server.js";
import { createApp as createCatalogApp } from "../../catalog-service/src/server.js";
import { createApp as createInventoryApp } from "../../inventory-service/src/server.js";
import { createApp as createBillingApp } from "../../billing-service/src/server.js";
import { createApp as createNotificationApp } from "../../notification-service/src/server.js";
import { createApp as createSearchApp } from "../../search-sync-service/src/server.js";

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

test("mvp happy path: onboarding -> catalog -> stock -> billing -> notifications -> search", async () => {
  const tenantServer = await listen(createTenantApp("tenant-e2e"));
  const vendorServer = await listen(createVendorApp("vendor-e2e"));
  const catalogServer = await listen(createCatalogApp("catalog-e2e"));
  const inventoryServer = await listen(createInventoryApp("inventory-e2e"));
  const notificationServer = await listen(createNotificationApp("notification-e2e"));
  const searchServer = await listen(createSearchApp("search-e2e"));

  const tenantPort = tenantServer.address().port;
  process.env.TENANT_SERVICE_URL = `http://127.0.0.1:${tenantPort}`;
  process.env.INTERNAL_SERVICE_TOKEN = "dev-internal-token";
  const billingServer = await listen(createBillingApp("billing-e2e"));

  const platformContext = {
    user: { id: "platform-user" },
    scopes: { isPlatformStaff: true },
    tenants: []
  };

  const newTenantRes = await fetch(`http://127.0.0.1:${tenantPort}/tenants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(platformContext)
    },
    body: JSON.stringify({ slug: "kzn-spares", name: "KZN Spares Hub" })
  });
  const tenant = await newTenantRes.json();

  const tenantAdminContext = {
    user: { id: "tenant-admin" },
    scopes: { isPlatformStaff: false },
    tenants: [{ tenantId: tenant.id, role: "tenant_admin" }],
    vendors: [],
    activeTenantId: tenant.id
  };

  const vendorRes = await fetch(`http://127.0.0.1:${vendorServer.address().port}/vendors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantAdminContext)
    },
    body: JSON.stringify({ tenantId: tenant.id, code: "KZN-A", name: "KZN Brake Imports" })
  });
  const vendor = await vendorRes.json();

  await fetch(`http://127.0.0.1:${catalogServer.address().port}/catalog/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth-context": JSON.stringify(tenantAdminContext)
    },
    body: JSON.stringify({ tenantId: tenant.id, code: "BRAKES", name: "Brakes" })
  });

  const vendorAdminContext = {
    user: { id: "vendor-admin" },
    scopes: { isPlatformStaff: false },
    tenants: [{ tenantId: tenant.id, role: "tenant_staff" }],
    vendors: [{ tenantId: tenant.id, vendorId: vendor.id, role: "vendor_admin" }],
    activeTenantId: tenant.id
  };

  const productRes = await fetch(
    `http://127.0.0.1:${catalogServer.address().port}/catalog/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(vendorAdminContext)
      },
      body: JSON.stringify({
        tenantId: tenant.id,
        vendorId: vendor.id,
        categoryId: "cat-brakes",
        title: "Corolla Front Pads",
        sku: "COR-PAD-001"
      })
    }
  );
  const product = await productRes.json();

  const variantRes = await fetch(
    `http://127.0.0.1:${catalogServer.address().port}/catalog/products/${product.id}/variants`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(vendorAdminContext)
      },
      body: JSON.stringify({
        sku: "COR-PAD-001-A",
        oemCode: "04465-0D120",
        aftermarketCode: "BP-011"
      })
    }
  );
  const variant = await variantRes.json();

  const stockRes = await fetch(
    `http://127.0.0.1:${inventoryServer.address().port}/inventory/adjustments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(vendorAdminContext)
      },
      body: JSON.stringify({
        tenantId: tenant.id,
        vendorId: vendor.id,
        variantId: variant.id,
        quantityDelta: 15,
        reason: "seed"
      })
    }
  );

  const checkoutRes = await fetch(
    `http://127.0.0.1:${billingServer.address().port}/billing/checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-context": JSON.stringify(tenantAdminContext)
      },
      body: JSON.stringify({ tenantId: tenant.id, planCode: "price_basic" })
    }
  );

  const webhookRes = await fetch(
    `http://127.0.0.1:${billingServer.address().port}/billing/webhooks/stripe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "evt_mvp_happy_path",
        type: "customer.subscription.created",
        data: {
          object: {
            id: "sub_happy",
            customer: "cus_happy",
            status: "active",
            metadata: { tenantId: tenant.id },
            items: { data: [{ price: { id: "price_basic" } }] }
          }
        }
      })
    }
  );

  const billingStateRes = await fetch(
    `http://127.0.0.1:${tenantPort}/tenants/${tenant.id}/billing`,
    {
      headers: { "x-auth-context": JSON.stringify(tenantAdminContext) }
    }
  );
  const billingState = await billingStateRes.json();

  const notifyRes = await fetch(
    `http://127.0.0.1:${notificationServer.address().port}/notifications/jobs`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order_update",
        to: "ops@kznspares.co.za",
        data: {
          recipientName: "KZN Ops",
          orderNumber: "ORD-DEMO-1",
          status: "picking",
          detailsUrl: "https://demo/orders/ORD-DEMO-1"
        }
      })
    }
  );

  const searchRes = await fetch(
    `http://127.0.0.1:${searchServer.address().port}/search?tenantId=11111111-1111-1111-1111-111111111111&q=hilux`,
    {
      headers: {
        "x-auth-context": JSON.stringify({
          user: { id: "tenant-admin" },
          scopes: { isPlatformStaff: false },
          tenants: [{ tenantId: "11111111-1111-1111-1111-111111111111", role: "tenant_admin" }],
          vendors: []
        })
      }
    }
  );

  tenantServer.close();
  vendorServer.close();
  catalogServer.close();
  inventoryServer.close();
  billingServer.close();
  notificationServer.close();
  searchServer.close();

  assert.equal(newTenantRes.status, 201);
  assert.equal(vendorRes.status, 201);
  assert.equal(productRes.status, 201);
  assert.equal(variantRes.status, 201);
  assert.equal(stockRes.status, 201);
  assert.equal(checkoutRes.status, 201);
  assert.equal(webhookRes.status, 200);
  assert.equal(billingState.subscriptionStatus, "active");
  assert.equal(notifyRes.status, 202);
  assert.equal(searchRes.status, 200);
});
