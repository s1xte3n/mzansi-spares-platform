import pg from "pg";

const memory = {
  vendors: [
    {
      id: "44444444-4444-4444-4444-444444444441",
      tenantId: "11111111-1111-1111-1111-111111111111",
      code: "SPARES-ONE",
      name: "Spares One"
    }
  ],
  products: [
    {
      id: "prod-1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      vendorId: "44444444-4444-4444-4444-444444444441",
      vendorName: "Spares One",
      title: "Brake Pad Set",
      sku: "PAD-001",
      oemCode: "OEM-PAD-001",
      aftermarketCode: "AM-PAD-001",
      partBrand: "Bosch",
      makeName: "Toyota",
      modelName: "Hilux",
      derivativeName: "2.8 GD-6",
      fitmentNotes: "Front axle"
    }
  ],
  orders: [
    {
      id: "ord-1",
      tenantId: "11111111-1111-1111-1111-111111111111",
      orderNumber: "SO-1001",
      status: "pending",
      vendorName: "Spares One",
      productTitle: "Brake Pad Set"
    }
  ]
};

const SEARCH_SQL = {
  vendors: `
    SELECT
      v.id,
      v.tenant_id AS "tenantId",
      v.code,
      v.name,
      ts_rank_cd(
        to_tsvector('simple', coalesce(v.name,'') || ' ' || coalesce(v.code,'')),
        websearch_to_tsquery('simple', $2)
      ) AS rank
    FROM vendor v
    WHERE v.tenant_id = $1
      AND (
        to_tsvector('simple', coalesce(v.name,'') || ' ' || coalesce(v.code,'')) @@ websearch_to_tsquery('simple', $2)
        OR v.name ILIKE '%' || $2 || '%'
      )
    ORDER BY rank DESC, v.name ASC
    LIMIT $3
  `,
  products: `
    SELECT
      p.id,
      p.tenant_id AS "tenantId",
      p.vendor_id AS "vendorId",
      v.name AS "vendorName",
      p.title,
      p.sku,
      p.oem_code AS "oemCode",
      p.aftermarket_code AS "aftermarketCode",
      pb.name AS "partBrand",
      vm.name AS "makeName",
      vmo.name AS "modelName",
      vd.name AS "derivativeName",
      pf.notes AS "fitmentNotes",
      ts_rank_cd(
        to_tsvector('simple',
          coalesce(v.name,'') || ' ' ||
          coalesce(p.title,'') || ' ' ||
          coalesce(p.sku,'') || ' ' ||
          coalesce(p.oem_code,'') || ' ' ||
          coalesce(p.aftermarket_code,'') || ' ' ||
          coalesce(pb.name,'') || ' ' ||
          coalesce(vm.name,'') || ' ' ||
          coalesce(vmo.name,'') || ' ' ||
          coalesce(vd.name,'') || ' ' ||
          coalesce(pf.notes,'')
        ),
        websearch_to_tsquery('simple', $2)
      ) AS rank
    FROM product p
    JOIN vendor v ON v.id = p.vendor_id
    LEFT JOIN part_brand pb ON pb.id = p.part_brand_id
    LEFT JOIN product_variant pv ON pv.product_id = p.id
    LEFT JOIN product_fitment pf ON pf.product_variant_id = pv.id
    LEFT JOIN vehicle_make vm ON vm.id = pf.vehicle_make_id
    LEFT JOIN vehicle_model vmo ON vmo.id = pf.vehicle_model_id
    LEFT JOIN vehicle_derivative vd ON vd.id = pf.vehicle_derivative_id
    WHERE p.tenant_id = $1
      AND (
        to_tsvector('simple',
          coalesce(v.name,'') || ' ' ||
          coalesce(p.title,'') || ' ' ||
          coalesce(p.sku,'') || ' ' ||
          coalesce(p.oem_code,'') || ' ' ||
          coalesce(p.aftermarket_code,'') || ' ' ||
          coalesce(pb.name,'') || ' ' ||
          coalesce(vm.name,'') || ' ' ||
          coalesce(vmo.name,'') || ' ' ||
          coalesce(vd.name,'') || ' ' ||
          coalesce(pf.notes,'')
        ) @@ websearch_to_tsquery('simple', $2)
        OR p.title ILIKE '%' || $2 || '%'
        OR p.sku ILIKE '%' || $2 || '%'
        OR p.oem_code ILIKE '%' || $2 || '%'
        OR p.aftermarket_code ILIKE '%' || $2 || '%'
      )
    ORDER BY rank DESC, p.title ASC
    LIMIT $3
  `,
  orders: `
    SELECT
      mo.id,
      mo.tenant_id AS "tenantId",
      mo.order_number AS "orderNumber",
      mo.status,
      v.name AS "vendorName",
      p.title AS "productTitle",
      ts_rank_cd(
        to_tsvector('simple',
          coalesce(mo.order_number,'') || ' ' ||
          coalesce(v.name,'') || ' ' ||
          coalesce(p.title,'') || ' ' ||
          coalesce(p.sku,'') || ' ' ||
          coalesce(p.oem_code,'') || ' ' ||
          coalesce(p.aftermarket_code,'')
        ),
        websearch_to_tsquery('simple', $2)
      ) AS rank
    FROM marketplace_order mo
    LEFT JOIN order_item oi ON oi.order_id = mo.id
    LEFT JOIN product_variant pv ON pv.id = oi.product_variant_id
    LEFT JOIN product p ON p.id = pv.product_id
    LEFT JOIN vendor v ON v.id = oi.vendor_id
    WHERE mo.tenant_id = $1
      AND (
        to_tsvector('simple',
          coalesce(mo.order_number,'') || ' ' ||
          coalesce(v.name,'') || ' ' ||
          coalesce(p.title,'') || ' ' ||
          coalesce(p.sku,'') || ' ' ||
          coalesce(p.oem_code,'') || ' ' ||
          coalesce(p.aftermarket_code,'')
        ) @@ websearch_to_tsquery('simple', $2)
        OR mo.order_number ILIKE '%' || $2 || '%'
      )
    ORDER BY rank DESC, mo.created_at DESC
    LIMIT $3
  `
};

function includesQuery(row, q, fields) {
  const lower = q.toLowerCase();
  return fields.some((field) =>
    String(row[field] ?? "")
      .toLowerCase()
      .includes(lower)
  );
}

export function createSearchRepository({ pool } = {}) {
  const dbPool =
    pool ??
    (process.env.DATABASE_URL ? new pg.Pool({ connectionString: process.env.DATABASE_URL }) : null);

  return {
    usingPostgres: Boolean(dbPool),
    async search({ tenantId, q, limit = 10 }) {
      if (dbPool) {
        const [vendors, products, orders] = await Promise.all([
          dbPool.query(SEARCH_SQL.vendors, [tenantId, q, limit]),
          dbPool.query(SEARCH_SQL.products, [tenantId, q, limit]),
          dbPool.query(SEARCH_SQL.orders, [tenantId, q, limit])
        ]);

        return {
          vendors: vendors.rows,
          products: products.rows,
          orders: orders.rows
        };
      }

      return {
        vendors: memory.vendors
          .filter((row) => row.tenantId === tenantId && includesQuery(row, q, ["name", "code"]))
          .slice(0, limit),
        products: memory.products
          .filter(
            (row) =>
              row.tenantId === tenantId &&
              includesQuery(row, q, [
                "vendorName",
                "title",
                "sku",
                "oemCode",
                "aftermarketCode",
                "partBrand",
                "makeName",
                "modelName",
                "derivativeName",
                "fitmentNotes"
              ])
          )
          .slice(0, limit),
        orders: memory.orders
          .filter(
            (row) =>
              row.tenantId === tenantId &&
              includesQuery(row, q, ["orderNumber", "vendorName", "productTitle"])
          )
          .slice(0, limit)
      };
    },
    async listAllIndexableDocuments({ tenantId }) {
      const { vendors, products, orders } = await this.search({ tenantId, q: "", limit: 2000 });
      return [
        ...vendors.map((item) => ({ ...item, type: "vendor" })),
        ...products.map((item) => ({ ...item, type: "product" })),
        ...orders.map((item) => ({ ...item, type: "order" }))
      ];
    }
  };
}
