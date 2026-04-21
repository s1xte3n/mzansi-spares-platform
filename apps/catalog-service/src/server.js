import express from "express";
import { fileURLToPath } from "node:url";
import {
  addFitment,
  addMedia,
  createCategory,
  createPartBrand,
  createProduct,
  createVariant,
  createVehicleDerivative,
  createVehicleMake,
  createVehicleModel,
  deletePartBrand,
  deleteVehicleDerivative,
  deleteVehicleMake,
  deleteVehicleModel,
  getProduct,
  getVehicleReference,
  listCategories,
  listFitmentsByVariant,
  listMedia,
  listPartBrands,
  listProducts,
  listVariants,
  updatePartBrand,
  updateProduct,
  updateVariant,
  updateVehicleDerivative,
  updateVehicleMake,
  updateVehicleModel,
  listVehicleModels,
  listVehicleDerivatives
} from "./store.js";

const MODERATION_STATES = ["draft", "pending_review", "approved", "rejected", "archived"];

function parseAuthContext(req) {
  try {
    return JSON.parse(req.header("x-auth-context") || "{}");
  } catch {
    return {};
  }
}

function hasVendorAdmin(authContext, vendorId) {
  return (authContext?.vendors ?? []).some(
    (membership) => membership.vendorId === vendorId && membership.role === "vendor_admin"
  );
}

function hasTenantReviewer(authContext, tenantId) {
  return (
    authContext?.scopes?.isPlatformStaff ||
    (authContext?.tenants ?? []).some(
      (membership) =>
        membership.tenantId === tenantId &&
        ["tenant_admin", "tenant_staff"].includes(membership.role)
    )
  );
}

function hasTenantScope(authContext, tenantId) {
  return (
    authContext?.scopes?.isPlatformStaff ||
    (authContext?.tenants ?? []).some((membership) => membership.tenantId === tenantId) ||
    (authContext?.vendors ?? []).some((membership) => membership.tenantId === tenantId)
  );
}

function resolveTenantId(req, authContext) {
  return req.header("x-tenant-id") || req.query.tenantId || authContext.activeTenantId;
}

export function createApp(serviceName = process.env.SERVICE_NAME || "catalog-service") {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res
      .status(200)
      .json({ status: "ok", service: serviceName, timestamp: new Date().toISOString() });
  });

  app.get("/catalog/categories", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(listCategories(tenantId));
  });

  app.post("/catalog/categories", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createCategory({ ...req.body, tenantId }));
  });

  app.get("/catalog/reference/part-brands", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);

    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(listPartBrands({ tenantId, q: req.query.q }));
  });

  app.post("/catalog/reference/part-brands", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;

    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createPartBrand({ ...req.body, tenantId }));
  });

  app.patch("/catalog/reference/part-brands/:brandId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;

    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const updated = updatePartBrand(req.params.brandId, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Part brand not found" });
    }

    return res.json(updated);
  });

  app.delete("/catalog/reference/part-brands/:brandId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);

    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const deleted = deletePartBrand(req.params.brandId);
    if (!deleted) {
      return res.status(404).json({ error: "Part brand not found" });
    }

    return res.status(204).send();
  });

  app.get("/catalog/brands", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(listPartBrands({ tenantId, q: req.query.q }));
  });

  app.post("/catalog/brands", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createPartBrand({ ...req.body, tenantId }));
  });

  app.get("/catalog/products", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    const vendorId = req.header("x-vendor-id") || null;

    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    if (
      vendorId &&
      !hasVendorAdmin(authContext, vendorId) &&
      !hasTenantReviewer(authContext, tenantId)
    ) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    return res.json(listProducts({ tenantId, vendorId }));
  });

  app.post("/catalog/products", (req, res) => {
    const authContext = parseAuthContext(req);
    const { tenantId, vendorId } = req.body;

    if (!hasVendorAdmin(authContext, vendorId)) {
      return res.status(403).json({ error: "Vendor admins can only manage their own products" });
    }

    if (!hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createProduct(req.body));
  });

  app.get("/catalog/products/:productId", (req, res) => {
    const product = getProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.json({
      product,
      variants: listVariants(product.id),
      media: listMedia(product.id)
    });
  });

  app.patch("/catalog/products/:productId", (req, res) => {
    const authContext = parseAuthContext(req);
    const product = getProduct(req.params.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!hasVendorAdmin(authContext, product.vendorId)) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    if (req.body.moderationState && !MODERATION_STATES.includes(req.body.moderationState)) {
      return res.status(400).json({ error: "Invalid moderation state" });
    }

    return res.json(updateProduct(product.id, req.body));
  });

  app.post("/catalog/products/:productId/submit-review", (req, res) => {
    const authContext = parseAuthContext(req);
    const product = getProduct(req.params.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!hasVendorAdmin(authContext, product.vendorId)) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    updateProduct(product.id, { moderationState: "pending_review" });
    return res.json(product);
  });

  app.post("/catalog/products/:productId/moderate", (req, res) => {
    const authContext = parseAuthContext(req);
    const product = getProduct(req.params.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!hasTenantReviewer(authContext, product.tenantId)) {
      return res.status(403).json({ error: "Tenant reviewers only" });
    }

    const nextState = req.body.moderationState;
    if (!["approved", "rejected", "archived"].includes(nextState)) {
      return res.status(400).json({ error: "Invalid moderation transition" });
    }

    updateProduct(product.id, { moderationState: nextState });
    return res.json(product);
  });

  app.get("/catalog/moderation-queue", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);

    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant reviewer scope denied" });
    }

    return res.json(
      listProducts({ tenantId }).filter((product) => product.moderationState === "pending_review")
    );
  });

  app.post("/catalog/products/:productId/variants", (req, res) => {
    const authContext = parseAuthContext(req);
    const product = getProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!hasVendorAdmin(authContext, product.vendorId)) {
      return res.status(403).json({ error: "Vendor scope denied" });
    }

    return res.status(201).json(createVariant({ ...req.body, productId: product.id }));
  });

  app.patch("/catalog/variants/:variantId", (req, res) => {
    const variant = updateVariant(req.params.variantId, req.body);
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }
    return res.json(variant);
  });

  app.post("/catalog/products/:productId/media", (req, res) => {
    const product = getProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(201).json(addMedia({ ...req.body, productId: product.id }));
  });

  app.get("/catalog/reference/vehicles", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(getVehicleReference({ tenantId, q: req.query.q }));
  });

  app.get("/catalog/reference/vehicle-models", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(listVehicleModels({ tenantId, makeId: req.query.makeId, q: req.query.q }));
  });

  app.get("/catalog/reference/vehicle-derivatives", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantScope(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.json(
      listVehicleDerivatives({ tenantId, modelId: req.query.modelId, q: req.query.q })
    );
  });

  app.post("/catalog/reference/vehicle-makes", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createVehicleMake({ ...req.body, tenantId }));
  });

  app.patch("/catalog/reference/vehicle-makes/:makeId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const updated = updateVehicleMake(req.params.makeId, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Vehicle make not found" });
    }

    return res.json(updated);
  });

  app.delete("/catalog/reference/vehicle-makes/:makeId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const deleted = deleteVehicleMake(req.params.makeId);
    if (!deleted) {
      return res.status(404).json({ error: "Vehicle make not found" });
    }

    return res.status(204).send();
  });

  app.post("/catalog/reference/vehicle-models", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createVehicleModel({ ...req.body, tenantId }));
  });

  app.patch("/catalog/reference/vehicle-models/:modelId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const updated = updateVehicleModel(req.params.modelId, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Vehicle model not found" });
    }

    return res.json(updated);
  });

  app.delete("/catalog/reference/vehicle-models/:modelId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const deleted = deleteVehicleModel(req.params.modelId);
    if (!deleted) {
      return res.status(404).json({ error: "Vehicle model not found" });
    }

    return res.status(204).send();
  });

  app.post("/catalog/reference/vehicle-derivatives", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    return res.status(201).json(createVehicleDerivative({ ...req.body, tenantId }));
  });

  app.patch("/catalog/reference/vehicle-derivatives/:derivativeId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = req.body.tenantId || authContext.activeTenantId;
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const updated = updateVehicleDerivative(req.params.derivativeId, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Vehicle derivative not found" });
    }

    return res.json(updated);
  });

  app.delete("/catalog/reference/vehicle-derivatives/:derivativeId", (req, res) => {
    const authContext = parseAuthContext(req);
    const tenantId = resolveTenantId(req, authContext);
    if (!tenantId || !hasTenantReviewer(authContext, tenantId)) {
      return res.status(403).json({ error: "Tenant scope denied" });
    }

    const deleted = deleteVehicleDerivative(req.params.derivativeId);
    if (!deleted) {
      return res.status(404).json({ error: "Vehicle derivative not found" });
    }

    return res.status(204).send();
  });

  app.post("/catalog/variants/:variantId/fitments", (req, res) => {
    const variant = updateVariant(req.params.variantId, {});
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" });
    }

    const fitment = addFitment({
      ...req.body,
      variantId: variant.id
    });

    return res.status(201).json({ fitment, fitments: listFitmentsByVariant(variant.id) });
  });

  return app;
}

export function startServer(port = Number(process.env.PORT || 3000)) {
  const serviceName = process.env.SERVICE_NAME || "catalog-service";
  const app = createApp(serviceName);
  return app.listen(port, () => {
    console.log(`${serviceName} listening on port ${port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startServer();
}
