export class AuthzError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "AuthzError";
    this.statusCode = statusCode;
  }
}

export function hasTenantAccess(authContext, tenantId) {
  return authContext.tenants.some((membership) => membership.tenantId === tenantId);
}

export function hasVendorAccess(authContext, vendorId) {
  return authContext.vendors.some((membership) => membership.vendorId === vendorId);
}

export function requireTenantAccess(authContext, tenantId) {
  if (!tenantId || !hasTenantAccess(authContext, tenantId)) {
    throw new AuthzError("Tenant scope denied.");
  }
}

export function requireVendorAccess(authContext, vendorId) {
  if (!vendorId || !hasVendorAccess(authContext, vendorId)) {
    throw new AuthzError("Vendor scope denied.");
  }
}

export function requireRole(authContext, allowedRoles = []) {
  const roles = [
    ...authContext.tenants.map((membership) => membership.role),
    ...authContext.vendors.map((membership) => membership.role)
  ];

  const isAllowed = allowedRoles.some((role) => roles.includes(role));

  if (!isAllowed) {
    throw new AuthzError("Role requirement not satisfied.");
  }
}
