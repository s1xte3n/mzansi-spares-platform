import { createSearchRepository } from "../src/repository.js";
import { createMeiliProjection } from "../src/meiliProjection.js";

const tenantId = process.argv[2] || process.env.TENANT_ID;

if (!tenantId) {
  console.error("Usage: npm run reindex -- <tenantId>");
  process.exit(1);
}

const repository = createSearchRepository();
const projection = createMeiliProjection();

const documents = await repository.listAllIndexableDocuments({ tenantId });
const result = await projection.reindex({ documents });

console.log(
  JSON.stringify(
    {
      tenantId,
      sourceOfTruth: repository.usingPostgres ? "postgres" : "in-memory-fallback",
      indexedDocuments: documents.length,
      projection: result
    },
    null,
    2
  )
);
