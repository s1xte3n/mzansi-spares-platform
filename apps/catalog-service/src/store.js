const initialState = {
  categories: [
    {
      id: "cat-brakes",
      tenantId: "11111111-1111-1111-1111-111111111111",
      code: "BRAKES",
      name: "Brakes"
    }
  ],
  partBrands: [
    {
      id: "brand-bosch",
      tenantId: "11111111-1111-1111-1111-111111111111",
      code: "BOSCH",
      name: "Bosch"
    }
  ],
  products: [],
  variants: [],
  media: [],
  fitments: [],
  vehicles: {
    makes: [
      {
        id: "make-toyota",
        tenantId: "11111111-1111-1111-1111-111111111111",
        code: "TOYOTA",
        name: "Toyota"
      }
    ],
    models: [
      {
        id: "model-hilux",
        tenantId: "11111111-1111-1111-1111-111111111111",
        makeId: "make-toyota",
        code: "HILUX",
        name: "Hilux"
      }
    ],
    derivatives: [
      {
        id: "deriv-hilux-gd6",
        tenantId: "11111111-1111-1111-1111-111111111111",
        modelId: "model-hilux",
        code: "GD6-28",
        name: "2.8 GD-6",
        yearFrom: 2016,
        yearTo: 2024
      }
    ]
  }
};

const state = structuredClone(initialState);

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function matchesQuery(record, q) {
  if (!q) {
    return true;
  }

  const needle = q.trim().toLowerCase();
  return [record.name, record.code]
    .filter(Boolean)
    .some((value) => value.toLowerCase().includes(needle));
}

export function listCategories(tenantId) {
  return state.categories.filter((category) => category.tenantId === tenantId);
}

export function createCategory(input) {
  const category = { id: makeId("cat"), ...input };
  state.categories.push(category);
  return category;
}

export function listPartBrands({ tenantId, q }) {
  return state.partBrands.filter((brand) => brand.tenantId === tenantId && matchesQuery(brand, q));
}

export function createPartBrand(input) {
  const brand = { id: makeId("brand"), ...input };
  state.partBrands.push(brand);
  return brand;
}

export function updatePartBrand(brandId, patch) {
  const brand = state.partBrands.find((item) => item.id === brandId);
  if (!brand) {
    return null;
  }

  Object.assign(brand, patch);
  return brand;
}

export function deletePartBrand(brandId) {
  const index = state.partBrands.findIndex((item) => item.id === brandId);
  if (index === -1) {
    return false;
  }

  state.partBrands.splice(index, 1);
  return true;
}

export function listProducts({ tenantId, vendorId }) {
  return state.products.filter(
    (product) => product.tenantId === tenantId && (!vendorId || product.vendorId === vendorId)
  );
}

export function getProduct(productId) {
  return state.products.find((product) => product.id === productId) ?? null;
}

export function createProduct(input) {
  const product = {
    id: makeId("product"),
    moderationState: "draft",
    ...input
  };
  state.products.push(product);
  return product;
}

export function updateProduct(productId, patch) {
  const product = getProduct(productId);
  if (!product) {
    return null;
  }

  Object.assign(product, patch);
  return product;
}

export function createVariant(input) {
  const variant = { id: makeId("variant"), ...input };
  state.variants.push(variant);
  return variant;
}

export function updateVariant(variantId, patch) {
  const variant = state.variants.find((item) => item.id === variantId);
  if (!variant) {
    return null;
  }

  Object.assign(variant, patch);
  return variant;
}

export function listVariants(productId) {
  return state.variants.filter((variant) => variant.productId === productId);
}

export function addMedia(input) {
  const media = { id: makeId("media"), ...input };
  state.media.push(media);
  return media;
}

export function listMedia(productId) {
  return state.media.filter((item) => item.productId === productId);
}

export function addFitment(input) {
  const fitment = { id: makeId("fitment"), ...input };
  state.fitments.push(fitment);
  return fitment;
}

export function listFitmentsByVariant(variantId) {
  return state.fitments.filter((fitment) => fitment.variantId === variantId);
}

export function listVehicleMakes({ tenantId, q }) {
  return state.vehicles.makes.filter((make) => make.tenantId === tenantId && matchesQuery(make, q));
}

export function createVehicleMake(input) {
  const make = { id: makeId("make"), ...input };
  state.vehicles.makes.push(make);
  return make;
}

export function updateVehicleMake(makeId, patch) {
  const make = state.vehicles.makes.find((item) => item.id === makeId);
  if (!make) {
    return null;
  }

  Object.assign(make, patch);
  return make;
}

export function deleteVehicleMake(makeId) {
  const models = state.vehicles.models.filter((item) => item.makeId === makeId);
  models.forEach((model) => deleteVehicleModel(model.id));

  const index = state.vehicles.makes.findIndex((item) => item.id === makeId);
  if (index === -1) {
    return false;
  }

  state.vehicles.makes.splice(index, 1);
  return true;
}

export function listVehicleModels({ tenantId, makeId, q }) {
  return state.vehicles.models.filter(
    (model) =>
      model.tenantId === tenantId && (!makeId || model.makeId === makeId) && matchesQuery(model, q)
  );
}

export function createVehicleModel(input) {
  const model = { id: makeId("model"), ...input };
  state.vehicles.models.push(model);
  return model;
}

export function updateVehicleModel(modelId, patch) {
  const model = state.vehicles.models.find((item) => item.id === modelId);
  if (!model) {
    return null;
  }

  Object.assign(model, patch);
  return model;
}

export function deleteVehicleModel(modelId) {
  state.vehicles.derivatives = state.vehicles.derivatives.filter(
    (item) => item.modelId !== modelId
  );

  const index = state.vehicles.models.findIndex((item) => item.id === modelId);
  if (index === -1) {
    return false;
  }

  state.vehicles.models.splice(index, 1);
  return true;
}

export function listVehicleDerivatives({ tenantId, modelId, q }) {
  return state.vehicles.derivatives.filter(
    (derivative) =>
      derivative.tenantId === tenantId &&
      (!modelId || derivative.modelId === modelId) &&
      matchesQuery(derivative, q)
  );
}

export function createVehicleDerivative(input) {
  const derivative = { id: makeId("derivative"), ...input };
  state.vehicles.derivatives.push(derivative);
  return derivative;
}

export function updateVehicleDerivative(derivativeId, patch) {
  const derivative = state.vehicles.derivatives.find((item) => item.id === derivativeId);
  if (!derivative) {
    return null;
  }

  Object.assign(derivative, patch);
  return derivative;
}

export function deleteVehicleDerivative(derivativeId) {
  const index = state.vehicles.derivatives.findIndex((item) => item.id === derivativeId);
  if (index === -1) {
    return false;
  }

  state.vehicles.derivatives.splice(index, 1);
  return true;
}

export function getVehicleReference({ tenantId, q }) {
  return {
    makes: listVehicleMakes({ tenantId, q }),
    models: listVehicleModels({ tenantId, q }),
    derivatives: listVehicleDerivatives({ tenantId, q })
  };
}

export function __resetCatalogState() {
  Object.assign(state, structuredClone(initialState));
}
