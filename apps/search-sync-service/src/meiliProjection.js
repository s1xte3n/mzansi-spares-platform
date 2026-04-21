import { MeiliSearch } from "meilisearch";

export function createMeiliProjection() {
  const host = process.env.MEILI_HOST;
  const apiKey = process.env.MEILI_MASTER_KEY;
  const indexUid = process.env.MEILI_INDEX_UID || "marketplace-search";

  if (!host) {
    return {
      enabled: false,
      async reindex() {
        return { enabled: false, message: "MEILI_HOST not configured; skipped." };
      }
    };
  }

  const client = new MeiliSearch({ host, apiKey });

  return {
    enabled: true,
    async reindex({ documents }) {
      const index = client.index(indexUid);
      await index.updateSearchableAttributes([
        "name",
        "code",
        "vendorName",
        "title",
        "sku",
        "oemCode",
        "aftermarketCode",
        "partBrand",
        "makeName",
        "modelName",
        "derivativeName",
        "fitmentNotes",
        "orderNumber",
        "productTitle"
      ]);
      const task = await index.addDocuments(documents);
      return { enabled: true, taskUid: task.taskUid, count: documents.length };
    }
  };
}
