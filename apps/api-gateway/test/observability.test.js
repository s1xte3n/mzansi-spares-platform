import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

test("gateway sets/echoes correlation id", async () => {
  const app = createApp("api-gateway-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: { "x-correlation-id": "corr-test-123" }
  });

  server.close();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-correlation-id"), "corr-test-123");
});

test("gateway rate limits sensitive routes", async () => {
  process.env.GATEWAY_SENSITIVE_RATE_LIMIT = "1";
  process.env.NODE_ENV = "development";

  const app = createApp("api-gateway-test");
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  const first = await fetch(`http://127.0.0.1:${port}/api/protected/me`, {
    headers: { "x-dev-clerk-user-id": "clerk_tenant_admin_1" }
  });
  const second = await fetch(`http://127.0.0.1:${port}/api/protected/me`, {
    headers: { "x-dev-clerk-user-id": "clerk_tenant_admin_1" }
  });

  server.close();

  assert.ok([403, 503].includes(first.status));
  assert.equal(second.status, 429);
});
