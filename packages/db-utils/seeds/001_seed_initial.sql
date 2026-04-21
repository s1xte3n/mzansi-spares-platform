-- Tenant
INSERT INTO tenant (id, slug, name, status, currency_code, country_code)
VALUES ('11111111-1111-1111-1111-111111111111', 'demo-spares', 'Demo Spares SA', 'active', 'ZAR', 'ZA')
ON CONFLICT (id) DO NOTHING;

-- Users
INSERT INTO app_user (id, clerk_user_id, email, full_name, is_platform_staff)
VALUES
  ('22222222-2222-2222-2222-222222222221', 'clerk_platform_admin_1', 'platform.admin@demo.local', 'Platform Admin', true),
  ('22222222-2222-2222-2222-222222222222', 'clerk_tenant_admin_1', 'tenant.admin@demo.local', 'Tenant Admin', false),
  ('22222222-2222-2222-2222-222222222223', 'clerk_vendor_a_1', 'vendor.a@demo.local', 'Vendor A User', false),
  ('22222222-2222-2222-2222-222222222224', 'clerk_vendor_b_1', 'vendor.b@demo.local', 'Vendor B User', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_membership (id, tenant_id, app_user_id, role)
VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'tenant_admin')
ON CONFLICT (tenant_id, app_user_id) DO NOTHING;

-- Vendors
INSERT INTO vendor (id, tenant_id, code, name, status)
VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'VEN-A', 'Alpha Auto Supplies', 'active'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'VEN-B', 'Beta Parts Traders', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor_user_membership (id, tenant_id, vendor_id, app_user_id, role)
VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222223', 'vendor_admin'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222224', 'vendor_admin')
ON CONFLICT (tenant_id, vendor_id, app_user_id) DO NOTHING;

-- Runtime settings
INSERT INTO tenant_setting (id, tenant_id, setting_key, value_json, updated_by_user_id)
VALUES
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'inventory.low_stock_threshold', '{"value": 5}', '22222222-2222-2222-2222-222222222222'),
  ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 'orders.default_currency', '{"value": "ZAR"}', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (tenant_id, setting_key) DO NOTHING;

-- Automotive reference data (tenant-editable scope via nullable tenant_id)
INSERT INTO vehicle_make (id, tenant_id, code, name)
VALUES
  ('77777777-7777-7777-7777-777777777771', NULL, 'TOYOTA', 'Toyota')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_model (id, tenant_id, vehicle_make_id, code, name)
VALUES
  ('77777777-7777-7777-7777-777777777772', NULL, '77777777-7777-7777-7777-777777777771', 'HILUX', 'Hilux')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_derivative (id, tenant_id, vehicle_model_id, code, name, year_from, year_to)
VALUES
  ('77777777-7777-7777-7777-777777777773', NULL, '77777777-7777-7777-7777-777777777772', '2.8-GD6-4X4', 'Hilux 2.8 GD-6 4x4', 2016, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO part_brand (id, tenant_id, code, name)
VALUES
  ('88888888-8888-8888-8888-888888888881', NULL, 'BOSCH', 'Bosch'),
  ('88888888-8888-8888-8888-888888888882', NULL, 'DENSO', 'Denso')
ON CONFLICT (id) DO NOTHING;

-- Catalog
INSERT INTO category (id, tenant_id, code, name)
VALUES
  ('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', 'BRAKES', 'Brakes')
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO product (id, tenant_id, vendor_id, category_id, part_brand_id, sku, oem_code, aftermarket_code, title, description)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', '99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888881', 'PAD-HILUX-FRONT-A', 'OEM-TOY-1234', 'AM-ALPHA-101', 'Hilux Front Brake Pad Set (Alpha)', 'Front brake pad set supplied by Alpha Auto Supplies'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444442', '99999999-9999-9999-9999-999999999991', '88888888-8888-8888-8888-888888888882', 'DISC-HILUX-FRONT-B', 'OEM-TOY-5678', 'AM-BETA-202', 'Hilux Front Brake Disc (Beta)', 'Front brake disc supplied by Beta Parts Traders')
ON CONFLICT (tenant_id, sku) DO NOTHING;

INSERT INTO product_variant (id, tenant_id, product_id, vendor_id, sku, oem_code, aftermarket_code, attributes_json, price_cents, currency_code)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '44444444-4444-4444-4444-444444444441', 'PAD-HILUX-FRONT-A-STD', 'OEM-TOY-1234', 'AM-ALPHA-101', '{"material":"ceramic"}', 145000, 'ZAR'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '44444444-4444-4444-4444-444444444442', 'DISC-HILUX-FRONT-B-STD', 'OEM-TOY-5678', 'AM-BETA-202', '{"diameter_mm":300}', 210000, 'ZAR')
ON CONFLICT (tenant_id, sku) DO NOTHING;

INSERT INTO product_fitment (id, tenant_id, product_variant_id, vehicle_make_id, vehicle_model_id, vehicle_derivative_id, notes)
VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777773', 'Front axle only'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '77777777-7777-7777-7777-777777777771', '77777777-7777-7777-7777-777777777772', '77777777-7777-7777-7777-777777777773', 'Pair required')
ON CONFLICT (tenant_id, product_variant_id, vehicle_derivative_id) DO NOTHING;

-- Single stock pool represented by inventory adjustments per variant
INSERT INTO inventory_adjustment (id, tenant_id, product_variant_id, quantity_delta, reason, note, created_by_user_id)
VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 20, 'initial_seed', 'Opening stock', '22222222-2222-2222-2222-222222222222'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 10, 'initial_seed', 'Opening stock', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Customer and multi-vendor order
INSERT INTO customer_record (id, tenant_id, full_name, phone, email)
VALUES ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', '11111111-1111-1111-1111-111111111111', 'Sipho Mokoena', '+27721234567', 'sipho@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketplace_order (id, tenant_id, customer_record_id, order_number, status, currency_code, subtotal_cents, total_cents)
VALUES ('ffffffff-ffff-ffff-ffff-fffffffffff1', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'ORD-10001', 'confirmed', 'ZAR', 355000, 355000)
ON CONFLICT (tenant_id, order_number) DO NOTHING;

INSERT INTO order_item (id, tenant_id, order_id, vendor_id, product_variant_id, quantity, unit_price_cents, line_total_cents)
VALUES
  ('12121212-1212-1212-1212-121212121211', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '44444444-4444-4444-4444-444444444441', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 145000, 145000),
  ('12121212-1212-1212-1212-121212121212', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', '44444444-4444-4444-4444-444444444442', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 1, 210000, 210000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_status_history (id, tenant_id, order_id, from_status, to_status, changed_by_user_id)
VALUES ('13131313-1313-1313-1313-131313131313', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'pending', 'confirmed', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_record (id, tenant_id, order_id, provider, provider_payment_id, status, amount_cents, currency_code)
VALUES ('14141414-1414-1414-1414-141414141414', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'stripe', 'pi_demo_123', 'succeeded', 355000, 'ZAR')
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_log (id, tenant_id, actor_user_id, entity_type, entity_id, action, payload_json)
VALUES ('15151515-1515-1515-1515-151515151515', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'marketplace_order', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'order.created', '{"order_number":"ORD-10001"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webhook_event (id, tenant_id, provider, event_type, external_event_id, payload_json, processed_at)
VALUES ('16161616-1616-1616-1616-161616161616', '11111111-1111-1111-1111-111111111111', 'stripe', 'payment_intent.succeeded', 'evt_demo_123', '{"payment_intent":"pi_demo_123"}', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO support_note (id, tenant_id, app_user_id, order_id, note)
VALUES ('17171717-1717-1717-1717-171717171717', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'Customer confirmed pickup at vendor split dispatch.')
ON CONFLICT (id) DO NOTHING;

-- Additional seed records for tenant creation/vendor onboarding/access-boundary scenarios
INSERT INTO tenant (id, slug, name, status, currency_code, country_code)
VALUES ('18181818-1818-1818-1818-181818181818', 'second-demo-spares', 'Second Demo Spares', 'active', 'ZAR', 'ZA')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor (id, tenant_id, code, name, status)
VALUES ('19191919-1919-1919-1919-191919191919', '18181818-1818-1818-1818-181818181818', 'VEN-C', 'Cape Parts Co', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO app_user (id, clerk_user_id, email, full_name, is_platform_staff)
VALUES ('20202020-2020-2020-2020-202020202020', 'clerk_vendor_c_1', 'vendor.c@demo.local', 'Vendor C User', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO vendor_user_membership (id, tenant_id, vendor_id, app_user_id, role)
VALUES ('21212121-2121-2121-2121-212121212121', '18181818-1818-1818-1818-181818181818', '19191919-1919-1919-1919-191919191919', '20202020-2020-2020-2020-202020202020', 'vendor_staff')
ON CONFLICT (tenant_id, vendor_id, app_user_id) DO NOTHING;

-- -------------------------------
-- Rich South African demo dataset
-- -------------------------------

-- Additional tenant and membership context
INSERT INTO app_user (id, clerk_user_id, email, full_name, is_platform_staff)
VALUES
  ('22222222-2222-2222-2222-222222222225', 'clerk_tenant_admin_2', 'ops.cape@demo.local', 'Cape Shop Admin', false),
  ('22222222-2222-2222-2222-222222222226', 'clerk_tenant_staff_1', 'inventory.jhb@demo.local', 'JHB Inventory Lead', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO tenant_membership (id, tenant_id, app_user_id, role)
VALUES
  ('33333333-3333-3333-3333-333333333332', '18181818-1818-1818-1818-181818181818', '22222222-2222-2222-2222-222222222225', 'tenant_admin'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222226', 'tenant_staff')
ON CONFLICT (tenant_id, app_user_id) DO NOTHING;

-- Third vendor for the main tenant (for stronger multi-vendor order demos)
INSERT INTO vendor (id, tenant_id, code, name, status)
VALUES ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', 'VEN-C', 'Karoo Drivetrain Specialists', 'active')
ON CONFLICT (id) DO NOTHING;

-- SA-common makes/models/derivatives
INSERT INTO vehicle_make (id, tenant_id, code, name)
VALUES
  ('77777777-7777-7777-7777-777777777774', NULL, 'VOLKSWAGEN', 'Volkswagen'),
  ('77777777-7777-7777-7777-777777777775', NULL, 'FORD', 'Ford'),
  ('77777777-7777-7777-7777-777777777776', NULL, 'NISSAN', 'Nissan')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_model (id, tenant_id, vehicle_make_id, code, name)
VALUES
  ('77777777-7777-7777-7777-777777777777', NULL, '77777777-7777-7777-7777-777777777774', 'POLO', 'Polo'),
  ('77777777-7777-7777-7777-777777777778', NULL, '77777777-7777-7777-7777-777777777774', 'AMAROK', 'Amarok'),
  ('77777777-7777-7777-7777-777777777779', NULL, '77777777-7777-7777-7777-777777777775', 'RANGER', 'Ranger'),
  ('77777777-7777-7777-7777-777777777780', NULL, '77777777-7777-7777-7777-777777777776', 'NP200', 'NP200')
ON CONFLICT (id) DO NOTHING;

INSERT INTO vehicle_derivative (id, tenant_id, vehicle_model_id, code, name, year_from, year_to)
VALUES
  ('77777777-7777-7777-7777-777777777781', NULL, '77777777-7777-7777-7777-777777777777', 'POLO-1.0-TSI', 'Polo 1.0 TSI Comfortline', 2018, NULL),
  ('77777777-7777-7777-7777-777777777782', NULL, '77777777-7777-7777-7777-777777777778', 'AMAROK-2.0-BI', 'Amarok 2.0 BiTDI 4Motion', 2023, NULL),
  ('77777777-7777-7777-7777-777777777783', NULL, '77777777-7777-7777-7777-777777777779', 'RANGER-2.0-BI', 'Ranger 2.0 BiTurbo Wildtrak', 2019, NULL),
  ('77777777-7777-7777-7777-777777777784', NULL, '77777777-7777-7777-7777-777777777780', 'NP200-1.6', 'NP200 1.6 Base', 2016, NULL)
ON CONFLICT (id) DO NOTHING;

-- Broader part brand data commonly seen in SA shops
INSERT INTO part_brand (id, tenant_id, code, name)
VALUES
  ('88888888-8888-8888-8888-888888888883', NULL, 'MANN', 'Mann Filter'),
  ('88888888-8888-8888-8888-888888888884', NULL, 'SACHS', 'Sachs'),
  ('88888888-8888-8888-8888-888888888885', NULL, 'NGK', 'NGK')
ON CONFLICT (id) DO NOTHING;

INSERT INTO category (id, tenant_id, code, name)
VALUES
  ('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', 'FILTERS', 'Filters'),
  ('99999999-9999-9999-9999-999999999993', '11111111-1111-1111-1111-111111111111', 'SUSPENSION', 'Suspension')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- Additional products with OEM + aftermarket codes and fitments
INSERT INTO product (id, tenant_id, vendor_id, category_id, part_brand_id, sku, oem_code, aftermarket_code, title, description)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444443', '99999999-9999-9999-9999-999999999992', '88888888-8888-8888-8888-888888888883', 'FLT-RANGER-AIR-C', 'AB39-9601-AA', 'MANN-C27009', 'Ranger Air Filter Element', 'High-flow air filter for Ford Ranger 2.0 BiTurbo'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', '99999999-9999-9999-9999-999999999993', '88888888-8888-8888-8888-888888888884', 'STR-POLO-FR-A', '6R0413031P', 'SACHS-317626', 'Polo Front Shock Absorber', 'Front shock absorber suitable for Polo 6R / AW variants')
ON CONFLICT (tenant_id, sku) DO NOTHING;

INSERT INTO product_variant (id, tenant_id, product_id, vendor_id, sku, oem_code, aftermarket_code, attributes_json, price_cents, currency_code)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '44444444-4444-4444-4444-444444444443', 'FLT-RANGER-AIR-C-STD', 'AB39-9601-AA', 'MANN-C27009', '{"service_interval_km":15000}', 48500, 'ZAR'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '44444444-4444-4444-4444-444444444441', 'STR-POLO-FR-A-STD', '6R0413031P', 'SACHS-317626', '{"position":"front"}', 126000, 'ZAR')
ON CONFLICT (tenant_id, sku) DO NOTHING;

INSERT INTO product_fitment (id, tenant_id, product_variant_id, vehicle_make_id, vehicle_model_id, vehicle_derivative_id, notes)
VALUES
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '77777777-7777-7777-7777-777777777775', '77777777-7777-7777-7777-777777777779', '77777777-7777-7777-7777-777777777783', 'Fits BiTurbo intake housing only'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc4', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '77777777-7777-7777-7777-777777777774', '77777777-7777-7777-7777-777777777777', '77777777-7777-7777-7777-777777777781', 'Replace in pairs for best ride quality')
ON CONFLICT (tenant_id, product_variant_id, vehicle_derivative_id) DO NOTHING;

-- Inventory showing both healthy and low-stock examples
INSERT INTO inventory_adjustment (id, tenant_id, product_variant_id, quantity_delta, reason, note, created_by_user_id)
VALUES
  ('dddddddd-dddd-dddd-dddd-ddddddddddd3', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 7, 'initial_seed', 'Low stock starter quantity', '22222222-2222-2222-2222-222222222226'),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd4', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 18, 'initial_seed', 'Ready stock for workshop demand', '22222222-2222-2222-2222-222222222226')
ON CONFLICT (id) DO NOTHING;

-- Additional sample orders, including multi-vendor split for realistic orchestration
INSERT INTO customer_record (id, tenant_id, full_name, phone, email)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', '11111111-1111-1111-1111-111111111111', 'Thando Nxumalo', '+27831239876', 'thando.n@example.com'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', '11111111-1111-1111-1111-111111111111', 'Anele Petersen', '+27795551234', 'anele.p@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marketplace_order (id, tenant_id, customer_record_id, order_number, status, currency_code, subtotal_cents, total_cents)
VALUES
  ('ffffffff-ffff-ffff-ffff-fffffffffff2', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'ORD-10002', 'picking', 'ZAR', 222500, 222500),
  ('ffffffff-ffff-ffff-ffff-fffffffffff3', '11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'ORD-10003', 'pending_payment', 'ZAR', 97000, 97000)
ON CONFLICT (tenant_id, order_number) DO NOTHING;

INSERT INTO order_item (id, tenant_id, order_id, vendor_id, product_variant_id, quantity, unit_price_cents, line_total_cents)
VALUES
  ('12121212-1212-1212-1212-121212121213', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff2', '44444444-4444-4444-4444-444444444443', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 1, 48500, 48500),
  ('12121212-1212-1212-1212-121212121214', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff2', '44444444-4444-4444-4444-444444444441', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', 1, 126000, 126000),
  ('12121212-1212-1212-1212-121212121215', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff2', '44444444-4444-4444-4444-444444444442', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 1, 48000, 48000),
  ('12121212-1212-1212-1212-121212121216', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff3', '44444444-4444-4444-4444-444444444441', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 97000, 97000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_status_history (id, tenant_id, order_id, from_status, to_status, changed_by_user_id)
VALUES
  ('13131313-1313-1313-1313-131313131314', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'confirmed', 'picking', '22222222-2222-2222-2222-222222222226'),
  ('13131313-1313-1313-1313-131313131315', '11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-fffffffffff3', 'draft', 'pending_payment', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Billing states for both tenants (for billing UI realism)
INSERT INTO tenant_setting (id, tenant_id, setting_key, value_json, updated_by_user_id)
VALUES
  ('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', 'billing.subscription', '{"subscriptionStatus":"active","subscriptionPlan":"price_pro_monthly","stripeCustomerId":"cus_demo_spares_001","stripeSubscriptionId":"sub_demo_spares_001"}', '22222222-2222-2222-2222-222222222221'),
  ('66666666-6666-6666-6666-666666666664', '18181818-1818-1818-1818-181818181818', 'billing.subscription', '{"subscriptionStatus":"past_due","subscriptionPlan":"price_basic_monthly","stripeCustomerId":"cus_second_demo_002","stripeSubscriptionId":"sub_second_demo_002"}', '22222222-2222-2222-2222-222222222221')
ON CONFLICT (tenant_id, setting_key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_by_user_id = EXCLUDED.updated_by_user_id, updated_at = now();

-- Notification and audit trail style records for realistic operations history
INSERT INTO audit_log (id, tenant_id, actor_user_id, entity_type, entity_id, action, payload_json)
VALUES
  ('15151515-1515-1515-1515-151515151516', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'tenant_membership', '33333333-3333-3333-3333-333333333333', 'notification.tenant_invite.sent', '{"channel":"email","to":"inventory.jhb@demo.local"}'),
  ('15151515-1515-1515-1515-151515151517', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'vendor_user_membership', '55555555-5555-5555-5555-555555555551', 'notification.vendor_invite.sent', '{"channel":"email","to":"vendor.a@demo.local"}'),
  ('15151515-1515-1515-1515-151515151518', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222226', 'marketplace_order', 'ffffffff-ffff-ffff-ffff-fffffffffff2', 'notification.order_update.sent', '{"channel":"email","template":"order_update","status":"picking"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO webhook_event (id, tenant_id, provider, event_type, external_event_id, payload_json, processed_at)
VALUES
  ('16161616-1616-1616-1616-161616161617', '11111111-1111-1111-1111-111111111111', 'stripe', 'customer.subscription.updated', 'evt_sub_active_001', '{"status":"active","plan":"price_pro_monthly"}', now()),
  ('16161616-1616-1616-1616-161616161618', '18181818-1818-1818-1818-181818181818', 'stripe', 'invoice.payment_failed', 'evt_invoice_failed_002', '{"status":"past_due","attempt":2}', now())
ON CONFLICT (id) DO NOTHING;
