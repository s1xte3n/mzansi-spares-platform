import React from "react";

export function TenantSwitcher({ tenantMemberships, activeTenantId, onChange }) {
  return (
    <label>
      Active tenant:&nbsp;
      <select value={activeTenantId ?? ""} onChange={(event) => onChange(event.target.value)}>
        {tenantMemberships.map((membership) => (
          <option key={membership.tenantId} value={membership.tenantId}>
            {membership.tenantId} ({membership.role})
          </option>
        ))}
      </select>
    </label>
  );
}
