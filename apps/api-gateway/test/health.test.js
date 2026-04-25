import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/server.js";

test("api-gateway /health returns 200 and service metadata", async () => {
  const app = createApp("api-gateway-test");
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/health`);
  const body = await response.json();

  server.close();

  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "api-gateway-test");
  assert.ok(body.timestamp);
});
