exports.up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

  pgm.createTable("tenant", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    slug: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "active" },
    currency_code: { type: "text", notNull: true, default: "ZAR" },
    country_code: { type: "text", notNull: true, default: "ZA" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("app_user", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    clerk_user_id: { type: "text", notNull: true, unique: true },
    email: { type: "text", notNull: true },
    full_name: { type: "text", notNull: true },
    is_platform_staff: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("tenant_membership", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    app_user_id: { type: "uuid", notNull: true, references: "app_user(id)", onDelete: "CASCADE" },
    role: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("tenant_membership", "tenant_membership_unique", {
    unique: ["tenant_id", "app_user_id"]
  });

  pgm.createTable("vendor", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "active" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("vendor", "vendor_tenant_code_unique", { unique: ["tenant_id", "code"] });

  pgm.createTable("vendor_user_membership", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    vendor_id: { type: "uuid", notNull: true, references: "vendor(id)", onDelete: "CASCADE" },
    app_user_id: { type: "uuid", notNull: true, references: "app_user(id)", onDelete: "CASCADE" },
    role: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("vendor_user_membership", "vendor_user_membership_unique", {
    unique: ["tenant_id", "vendor_id", "app_user_id"]
  });

  pgm.createTable("tenant_setting", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    setting_key: { type: "text", notNull: true },
    value_json: { type: "jsonb", notNull: true },
    updated_by_user_id: { type: "uuid", references: "app_user(id)", onDelete: "SET NULL" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("tenant_setting", "tenant_setting_unique", {
    unique: ["tenant_id", "setting_key"]
  });

  pgm.createTable("vehicle_make", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid" },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("vehicle_model", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid" },
    vehicle_make_id: {
      type: "uuid",
      notNull: true,
      references: "vehicle_make(id)",
      onDelete: "CASCADE"
    },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("vehicle_derivative", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid" },
    vehicle_model_id: {
      type: "uuid",
      notNull: true,
      references: "vehicle_model(id)",
      onDelete: "CASCADE"
    },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    year_from: { type: "integer" },
    year_to: { type: "integer" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("part_brand", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid" },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("category", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("category", "category_tenant_code_unique", { unique: ["tenant_id", "code"] });

  pgm.createTable("product", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    vendor_id: { type: "uuid", notNull: true, references: "vendor(id)", onDelete: "RESTRICT" },
    category_id: { type: "uuid", references: "category(id)", onDelete: "SET NULL" },
    part_brand_id: { type: "uuid", references: "part_brand(id)", onDelete: "SET NULL" },
    sku: { type: "text", notNull: true },
    oem_code: { type: "text" },
    aftermarket_code: { type: "text" },
    title: { type: "text", notNull: true },
    description: { type: "text" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("product", "product_tenant_sku_unique", { unique: ["tenant_id", "sku"] });

  pgm.createTable("product_variant", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product(id)", onDelete: "CASCADE" },
    vendor_id: { type: "uuid", notNull: true, references: "vendor(id)", onDelete: "RESTRICT" },
    sku: { type: "text", notNull: true },
    oem_code: { type: "text" },
    aftermarket_code: { type: "text" },
    attributes_json: { type: "jsonb", notNull: true, default: "{}" },
    price_cents: { type: "integer", notNull: true },
    currency_code: { type: "text", notNull: true, default: "ZAR" },
    is_active: { type: "boolean", notNull: true, default: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("product_variant", "product_variant_tenant_sku_unique", {
    unique: ["tenant_id", "sku"]
  });

  pgm.createTable("product_media", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    product_id: { type: "uuid", notNull: true, references: "product(id)", onDelete: "CASCADE" },
    url: { type: "text", notNull: true },
    media_type: { type: "text", notNull: true, default: "image" },
    alt_text: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("product_fitment", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    product_variant_id: {
      type: "uuid",
      notNull: true,
      references: "product_variant(id)",
      onDelete: "CASCADE"
    },
    vehicle_make_id: {
      type: "uuid",
      notNull: true,
      references: "vehicle_make(id)",
      onDelete: "RESTRICT"
    },
    vehicle_model_id: {
      type: "uuid",
      notNull: true,
      references: "vehicle_model(id)",
      onDelete: "RESTRICT"
    },
    vehicle_derivative_id: {
      type: "uuid",
      notNull: true,
      references: "vehicle_derivative(id)",
      onDelete: "RESTRICT"
    },
    notes: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("product_fitment", "product_fitment_variant_derivative_unique", {
    unique: ["tenant_id", "product_variant_id", "vehicle_derivative_id"]
  });

  pgm.createTable("customer_record", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    full_name: { type: "text", notNull: true },
    phone: { type: "text" },
    email: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("marketplace_order", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    customer_record_id: { type: "uuid", references: "customer_record(id)", onDelete: "SET NULL" },
    order_number: { type: "text", notNull: true },
    status: { type: "text", notNull: true, default: "pending" },
    currency_code: { type: "text", notNull: true, default: "ZAR" },
    subtotal_cents: { type: "integer", notNull: true, default: 0 },
    total_cents: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
  pgm.addConstraint("marketplace_order", "marketplace_order_tenant_order_number_unique", {
    unique: ["tenant_id", "order_number"]
  });

  pgm.createTable("order_item", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "marketplace_order(id)",
      onDelete: "CASCADE"
    },
    vendor_id: { type: "uuid", notNull: true, references: "vendor(id)", onDelete: "RESTRICT" },
    product_variant_id: {
      type: "uuid",
      notNull: true,
      references: "product_variant(id)",
      onDelete: "RESTRICT"
    },
    quantity: { type: "integer", notNull: true },
    unit_price_cents: { type: "integer", notNull: true },
    line_total_cents: { type: "integer", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("inventory_adjustment", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    product_variant_id: {
      type: "uuid",
      notNull: true,
      references: "product_variant(id)",
      onDelete: "CASCADE"
    },
    quantity_delta: { type: "integer", notNull: true },
    reason: { type: "text", notNull: true },
    note: { type: "text" },
    created_by_user_id: { type: "uuid", references: "app_user(id)", onDelete: "SET NULL" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("order_status_history", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "marketplace_order(id)",
      onDelete: "CASCADE"
    },
    from_status: { type: "text" },
    to_status: { type: "text", notNull: true },
    changed_by_user_id: { type: "uuid", references: "app_user(id)", onDelete: "SET NULL" },
    changed_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("payment_record", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", notNull: true, references: "tenant(id)", onDelete: "CASCADE" },
    order_id: {
      type: "uuid",
      notNull: true,
      references: "marketplace_order(id)",
      onDelete: "CASCADE"
    },
    provider: { type: "text", notNull: true, default: "stripe" },
    provider_payment_id: { type: "text" },
    status: { type: "text", notNull: true, default: "pending" },
    amount_cents: { type: "integer", notNull: true },
    currency_code: { type: "text", notNull: true, default: "ZAR" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("audit_log", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", references: "tenant(id)", onDelete: "SET NULL" },
    actor_user_id: { type: "uuid", references: "app_user(id)", onDelete: "SET NULL" },
    entity_type: { type: "text", notNull: true },
    entity_id: { type: "uuid" },
    action: { type: "text", notNull: true },
    payload_json: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("webhook_event", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", references: "tenant(id)", onDelete: "SET NULL" },
    provider: { type: "text", notNull: true },
    event_type: { type: "text", notNull: true },
    external_event_id: { type: "text" },
    payload_json: { type: "jsonb", notNull: true, default: "{}" },
    processed_at: { type: "timestamptz" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("support_note", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    tenant_id: { type: "uuid", references: "tenant(id)", onDelete: "SET NULL" },
    app_user_id: { type: "uuid", references: "app_user(id)", onDelete: "SET NULL" },
    order_id: { type: "uuid", references: "marketplace_order(id)", onDelete: "SET NULL" },
    note: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createIndex("product", ["tenant_id", "sku"]);
  pgm.createIndex("product", ["tenant_id", "oem_code"]);
  pgm.createIndex("product", ["tenant_id", "aftermarket_code"]);
  pgm.createIndex("product_variant", ["tenant_id", "sku"]);
  pgm.createIndex("part_brand", ["name"]);
  pgm.createIndex("vehicle_make", ["name"]);
  pgm.createIndex("vehicle_model", ["name"]);
  pgm.createIndex("vehicle_derivative", ["name"]);
  pgm.createIndex("order_item", ["tenant_id", "order_id"]);
  pgm.createIndex("inventory_adjustment", ["tenant_id", "product_variant_id"]);
  pgm.createIndex("tenant_setting", ["tenant_id", "setting_key"]);
};

exports.down = (pgm) => {
  pgm.dropTable("support_note");
  pgm.dropTable("webhook_event");
  pgm.dropTable("audit_log");
  pgm.dropTable("payment_record");
  pgm.dropTable("order_status_history");
  pgm.dropTable("inventory_adjustment");
  pgm.dropTable("order_item");
  pgm.dropTable("marketplace_order");
  pgm.dropTable("customer_record");
  pgm.dropTable("product_fitment");
  pgm.dropTable("product_media");
  pgm.dropTable("product_variant");
  pgm.dropTable("product");
  pgm.dropTable("category");
  pgm.dropTable("part_brand");
  pgm.dropTable("vehicle_derivative");
  pgm.dropTable("vehicle_model");
  pgm.dropTable("vehicle_make");
  pgm.dropTable("tenant_setting");
  pgm.dropTable("vendor_user_membership");
  pgm.dropTable("vendor");
  pgm.dropTable("tenant_membership");
  pgm.dropTable("app_user");
  pgm.dropTable("tenant");
};
