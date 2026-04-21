import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";
import { createSearchRepository } from "../src/repository.js";

test("global search returns grouped products, vendors, and orders", async () => {
  const app = createApp("search-test", createSearchRepository());
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const auth = {
    user: { id: "tenant-staff" },
    scopes: { isPlatformStaff: false },
    tenants: [{ tenantId: "11111111-1111-1111-1111-111111111111", role: "tenant_staff" }],
    vendors: []
  };

  const response = await fetch(
    `http://127.0.0.1:${port}/search?tenantId=11111111-1111-1111-1111-111111111111&q=hilux`,
    { headers: { "x-auth-context": JSON.stringify(auth) } }
  );
  const payload = await response.json();

  server.close();

  assert.equal(response.status, 200);
  assert.equal(payload.products.length, 1);
  assert.equal(payload.vendors.length, 0);
  assert.equal(payload.orders.length, 0);
  assert.match(payload.products[0].fitmentLabel, /Toyota/);
});

test("repository uses postgres queries when pool is provided", async () => {
  const calls = [];
  const mockPool = {
    async query(sql, params) {
      calls.push({ sql, params });
      return { rows: [] };
    }
  };

  const repository = createSearchRepository({ pool: mockPool });
  await repository.search({ tenantId: "t-1", q: "abc", limit: 3 });

  assert.equal(calls.length, 3);
  assert.equal(calls[0].params[0], "t-1");
  assert.equal(calls[0].params[1], "abc");
  assert.equal(calls[0].params[2], 3);
});
