import test from "node:test";
import assert from "node:assert/strict";
import { createMeiliProjection } from "../src/meiliProjection.js";

test("meili projection is safely disabled when MEILI_HOST is missing", async () => {
  const previousHost = process.env.MEILI_HOST;
  delete process.env.MEILI_HOST;

  const projection = createMeiliProjection();
  const result = await projection.reindex({ documents: [{ id: "x" }] });

  if (previousHost) {
    process.env.MEILI_HOST = previousHost;
  }

  assert.equal(projection.enabled, false);
  assert.equal(result.enabled, false);
});
