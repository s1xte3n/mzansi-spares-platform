const DEFAULT_SETTINGS = {
  vatBehavior: {
    mode: "standard",
    ratePercent: 15,
    pricesIncludeVat: true
  },
  markupRules: [
    {
      name: "default",
      categoryCode: "*",
      minPercent: 12,
      maxPercent: 20
    }
  ],
  lowStockThreshold: 5,
  supportedProvinces: ["Gauteng", "Western Cape", "KwaZulu-Natal"],
  invoiceMetadata: {
    displayName: "Demo Spares SA",
    registrationNumber: "2019/000001/07",
    vatNumber: "4123456789",
    paymentTermsDays: 30,
    bankingReference: "INVOICE"
  },
  approvalRules: {
    requireCatalogReview: true,
    autoApproveTrustedVendorIds: [],
    maxDiscountPercent: 15
  }
};

const initialState = {
  stock: [
    {
      tenantId: "11111111-1111-1111-1111-111111111111",
      variantId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
      vendorId: "44444444-4444-4444-4444-444444444441",
      stockOnHand: 20,
      reservedStock: 0
    }
  ],
  adjustments: [],
  settings: {
    "11111111-1111-1111-1111-111111111111": structuredClone(DEFAULT_SETTINGS)
  }
};

const state = structuredClone(initialState);
const settingsCache = new Map();
const SETTINGS_CACHE_TTL_MS = Number(process.env.SETTINGS_CACHE_TTL_MS || 30_000);

function makeId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function getOrCreateStockRecord({ tenantId, variantId, vendorId }) {
  let record = state.stock.find(
    (item) => item.tenantId === tenantId && item.variantId === variantId
  );

  if (!record) {
    record = { tenantId, variantId, vendorId, stockOnHand: 0, reservedStock: 0 };
    state.stock.push(record);
  }

  return record;
}

function pushAdjustment(event) {
  const entry = {
    id: makeId("inv-adj"),
    createdAt: new Date().toISOString(),
    ...event
  };

  state.adjustments.push(entry);
  return entry;
}

function mergeSettings(existing, patch) {
  const merged = structuredClone(existing);

  if (typeof patch.lowStockThreshold === "number") {
    merged.lowStockThreshold = patch.lowStockThreshold;
  }

  if (patch.vatBehavior) {
    Object.assign(merged.vatBehavior, patch.vatBehavior);
  }

  if (Array.isArray(patch.markupRules)) {
    merged.markupRules = patch.markupRules;
  }

  if (Array.isArray(patch.supportedProvinces)) {
    merged.supportedProvinces = patch.supportedProvinces;
  }

  if (patch.invoiceMetadata) {
    Object.assign(merged.invoiceMetadata, patch.invoiceMetadata);
  }

  if (patch.approvalRules) {
    Object.assign(merged.approvalRules, patch.approvalRules);
  }

  return merged;
}

function getFromCache(tenantId) {
  const cached = settingsCache.get(tenantId);
  if (!cached || cached.expiresAt <= Date.now()) {
    settingsCache.delete(tenantId);
    return null;
  }

  return structuredClone(cached.value);
}

function writeCache(tenantId, value) {
  settingsCache.set(tenantId, {
    value: structuredClone(value),
    expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS
  });
}

function ensureTenantSettings(tenantId) {
  if (!state.settings[tenantId]) {
    state.settings[tenantId] = structuredClone(DEFAULT_SETTINGS);
  }

  return state.settings[tenantId];
}

export function getAvailableStock(record) {
  return record.stockOnHand - record.reservedStock;
}

export function listStock(tenantId) {
  return state.stock
    .filter((record) => record.tenantId === tenantId)
    .map((record) => ({ ...record, availableStock: getAvailableStock(record) }));
}

export function getStockDetail(tenantId, variantId) {
  const record = state.stock.find(
    (item) => item.tenantId === tenantId && item.variantId === variantId
  );

  if (!record) {
    return null;
  }

  return {
    ...record,
    availableStock: getAvailableStock(record),
    history: state.adjustments.filter(
      (entry) => entry.tenantId === tenantId && entry.variantId === variantId
    )
  };
}

export function manualAdjustment(input) {
  const record = getOrCreateStockRecord(input);
  const nextStock = record.stockOnHand + input.quantityDelta;

  if (nextStock < 0) {
    throw new Error("stock_on_hand cannot be negative");
  }

  record.stockOnHand = nextStock;
  return pushAdjustment({
    type: "manual_adjustment",
    ...input,
    quantityDelta: input.quantityDelta
  });
}

export function reserveStock(input) {
  const record = getOrCreateStockRecord(input);

  if (getAvailableStock(record) < input.quantity) {
    throw new Error("insufficient available stock");
  }

  record.reservedStock += input.quantity;

  return pushAdjustment({
    type: "reservation",
    ...input,
    quantityDelta: 0,
    reservedDelta: input.quantity
  });
}

export function releaseStock(input) {
  const record = getOrCreateStockRecord(input);

  if (record.reservedStock - input.quantity < 0) {
    throw new Error("reserved_stock cannot be negative");
  }

  record.reservedStock -= input.quantity;

  return pushAdjustment({
    type: "release",
    ...input,
    quantityDelta: 0,
    reservedDelta: -input.quantity
  });
}

export function fulfillStock(input) {
  const record = getOrCreateStockRecord(input);

  if (record.reservedStock - input.quantity < 0) {
    throw new Error("reserved_stock cannot be negative");
  }

  if (record.stockOnHand - input.quantity < 0) {
    throw new Error("stock_on_hand cannot be negative");
  }

  record.reservedStock -= input.quantity;
  record.stockOnHand -= input.quantity;

  return pushAdjustment({
    type: "fulfillment",
    ...input,
    quantityDelta: -input.quantity,
    reservedDelta: -input.quantity
  });
}

export function getTenantSettings(tenantId) {
  const cached = getFromCache(tenantId);
  if (cached) {
    return cached;
  }

  const settings = ensureTenantSettings(tenantId);
  writeCache(tenantId, settings);
  return structuredClone(settings);
}

export function updateTenantSettings(tenantId, patch) {
  const existing = ensureTenantSettings(tenantId);
  const next = mergeSettings(existing, patch);
  state.settings[tenantId] = next;
  settingsCache.delete(tenantId);
  return getTenantSettings(tenantId);
}

export function getLowStockThreshold(tenantId) {
  return getTenantSettings(tenantId).lowStockThreshold;
}

export function setLowStockThreshold(tenantId, threshold) {
  return updateTenantSettings(tenantId, { lowStockThreshold: threshold });
}

export function listLowStock(tenantId) {
  const threshold = getLowStockThreshold(tenantId);

  return listStock(tenantId).filter((record) => record.availableStock <= threshold);
}

export function __resetInventoryState() {
  state.stock.length = 0;
  state.adjustments.length = 0;
  Object.keys(state.settings).forEach((key) => delete state.settings[key]);

  const fresh = structuredClone(initialState);
  state.stock.push(...fresh.stock);
  state.adjustments.push(...fresh.adjustments);
  Object.assign(state.settings, fresh.settings);
  settingsCache.clear();
}
