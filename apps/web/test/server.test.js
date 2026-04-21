import test from "node:test";
import assert from "node:assert/strict";
import { createWebServer } from "../src/server.js";

test("web server returns local stub page", async () => {
  const server = createWebServer();
  server.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}`);
  const html = await response.text();

  server.close();

  assert.equal(response.status, 200);
  assert.match(html, /mzansi-spares-platform web/);
});
