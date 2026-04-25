import React from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Button, Card, Input, PageTitle } from "@packages/ui/src/index.jsx";

const demo = {
  platform: { shops: 2, activeVendors: 3, monthlyOrders: 186, mrr: "R 18,900" },
  tenant: { name: "Demo Spares SA", city: "Johannesburg", openOrders: 12, lowStock: 3 },
  vendors: [
    { id: "v-1", name: "Turbo Parts Co", status: "Active", sla: "98%" },
    { id: "v-2", name: "Bosveld Bearings", status: "Active", sla: "95%" },
    { id: "v-3", name: "Karoo Drivetrain Specialists", status: "Active", sla: "96%" }
  ],
  products: [
    {
      id: "p-1",
      title: "Toyota Hilux Brake Pad Set",
      sku: "PAD-HILUX-001",
      brand: "Bosch",
      fitment: "Toyota / Hilux / 2.8 GD-6",
      stock: 24
    },
    {
      id: "p-2",
      title: "Ford Ranger Air Filter Element",
      sku: "FLT-RANGER-018",
      brand: "Mann Filter",
      fitment: "Ford / Ranger / 2.0 BiTurbo Wildtrak",
      stock: 7
    }
  ],
  orders: [
    { id: "o-1001", number: "SO-1001", customer: "Mpho Dlamini", status: "Picking", vendors: 3 },
    { id: "o-1002", number: "SO-1002", customer: "Lerato Mokoena", status: "Ready", vendors: 1 },
    {
      id: "o-1003",
      number: "SO-1003",
      customer: "Anele Petersen",
      status: "Pending payment",
      vendors: 1
    }
  ],
  demoFlows: [
    "Onboard a new shop and assign tenant admins",
    "Add a new vendor and invite vendor staff",
    "Create a fitment-aware product with Toyota/Volkswagen/Ford/Nissan fitments",
    "Adjust stock and verify low-stock alerts",
    "Process a multi-vendor order from pick to dispatch"
  ]
};

const nav = [
  ["/platform", "Platform dashboard"],
  ["/tenant", "Tenant dashboard"],
  ["/vendor", "Vendor dashboard"],
  ["/tenants", "Tenant management"],
  ["/vendors", "Vendor management"],
  ["/products", "Product list/detail/editor"],
  ["/fitment", "Fitment data management"],
  ["/brands", "Brands & categories"],
  ["/inventory", "Inventory list/detail"],
  ["/low-stock", "Low-stock view"],
  ["/orders", "Order list/detail"],
  ["/billing", "Billing"],
  ["/settings", "Settings"],
  ["/demo-flows", "Demo flows"]
];

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  return (
    <div className="text-xs text-slate-500">Demo Mode / {parts.join(" / ") || "platform"}</div>
  );
}

function Shell({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex">
        <aside className="w-72 border-r bg-white p-4">
          <PageTitle title="Mzansi Spares" subtitle="Interactive demo prototype" />
          <div className="mt-4 space-y-1 text-sm">
            {nav.map(([href, label]) => (
              <Link key={href} className="block rounded px-2 py-1 hover:bg-slate-100" to={href}>
                {label}
              </Link>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6">
          <header className="mb-4 flex items-center justify-between rounded bg-white p-4 shadow-sm">
            <div>
              <Breadcrumbs />
              <h1 className="text-xl font-semibold">{title}</h1>
              <p className="text-sm text-slate-600">{subtitle}</p>
            </div>
            <div className="flex gap-2">
              <Input value="Demo operator" readOnly />
              <Button>Presentation Mode</Button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

function Metrics({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="text-2xl font-semibold">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            {columns.map((column) => (
              <th key={column} className="py-2">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Screen({ title, subtitle, children }) {
  return (
    <Shell title={title} subtitle={subtitle}>
      {children}
    </Shell>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/platform" replace />} />
      <Route
        path="/platform"
        element={
          <Screen title="Platform dashboard" subtitle="Cross-tenant executive overview">
            <Metrics
              items={[
                { label: "Shops", value: demo.platform.shops },
                { label: "Vendors", value: demo.platform.activeVendors },
                { label: "Monthly orders", value: demo.platform.monthlyOrders },
                { label: "MRR", value: demo.platform.mrr }
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/tenant"
        element={
          <Screen title="Tenant dashboard" subtitle="Operational pulse for a single shop">
            <Metrics
              items={[
                { label: "Tenant", value: demo.tenant.name },
                { label: "City", value: demo.tenant.city },
                { label: "Open orders", value: demo.tenant.openOrders },
                { label: "Low stock", value: demo.tenant.lowStock }
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/vendor"
        element={
          <Screen title="Vendor dashboard" subtitle="Vendor fulfillment and performance">
            <Table
              columns={["Vendor", "Status", "SLA"]}
              rows={demo.vendors.map((v) => [v.name, v.status, v.sla])}
            />
          </Screen>
        }
      />
      <Route
        path="/tenants"
        element={
          <Screen title="Tenant management" subtitle="Onboard, activate, suspend and support shops">
            <Table
              columns={["Tenant", "Status", "Plan"]}
              rows={[
                ["Demo Spares SA", "Active", "Pro"],
                ["Cape Auto Hub", "Trial", "Basic"],
                ["Limpopo Parts", "Active", "Basic"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/vendors"
        element={
          <Screen title="Vendor management" subtitle="Invite and govern supplier network">
            <Table
              columns={["Vendor", "Category", "Status"]}
              rows={[
                ["Turbo Parts Co", "Performance", "Active"],
                ["Bosveld Bearings", "Engine", "Active"],
                ["Coastal Electrical", "Electrical", "Pending"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/products"
        element={
          <Screen
            title="Product list/detail/editor"
            subtitle="Create polished fitment-aware catalog entries"
          >
            <Table
              columns={["Title", "SKU", "Brand", "Fitment", "Stock"]}
              rows={demo.products.map((p) => [p.title, p.sku, p.brand, p.fitment, p.stock])}
            />
            <Card className="mt-4">
              <p className="font-medium">Product editor preview</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                <Input placeholder="Title" value="Toyota Hilux Brake Pad Set" readOnly />
                <Input placeholder="SKU" value="PAD-HILUX-001" readOnly />
                <Input placeholder="OEM code" value="04465-0K340" readOnly />
                <Input placeholder="Aftermarket code" value="BP-4501" readOnly />
              </div>
            </Card>
          </Screen>
        }
      />
      <Route
        path="/fitment"
        element={
          <Screen
            title="Fitment data management"
            subtitle="Makes, models, derivatives and compatibility rules"
          >
            <Table
              columns={["Make", "Model", "Derivative", "Years"]}
              rows={[
                ["Toyota", "Hilux", "2.8 GD-6", "2016-2024"],
                ["Ford", "Ranger", "Raptor", "2022-2026"],
                ["VW", "Polo", "1.0 TSI", "2018-2024"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/brands"
        element={
          <Screen title="Brands & categories" subtitle="Part brand and category curation">
            <Table
              columns={["Brand", "Category", "Active products"]}
              rows={[
                ["Bosch", "Braking", "124"],
                ["Mann Filter", "Filters", "98"],
                ["Sachs", "Suspension", "66"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/inventory"
        element={
          <Screen title="Inventory list/detail" subtitle="Variant-level stock management">
            <Table
              columns={["Variant", "On hand", "Reserved", "Available"]}
              rows={[
                ["PAD-HILUX-001", "24", "3", "21"],
                ["FLT-RANGER-018", "6", "1", "5"],
                ["BELT-POLO-004", "12", "0", "12"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/low-stock"
        element={
          <Screen title="Low-stock view" subtitle="Attention list for replenishment">
            <Table
              columns={["Variant", "Threshold", "Available", "Vendor"]}
              rows={[
                ["FLT-RANGER-018", "8", "5", "Turbo Parts Co"],
                ["COIL-POLO-010", "6", "2", "Coastal Electrical"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/orders"
        element={
          <Screen title="Order list/detail" subtitle="Multi-vendor order orchestration">
            <Table
              columns={["Order", "Customer", "Status", "Vendors"]}
              rows={demo.orders.map((o) => [o.number, o.customer, o.status, o.vendors])}
            />
            <Card className="mt-4">
              <p className="font-medium">Order SO-1001 detail</p>
              <p className="text-sm text-slate-600">
                Split fulfillment: Turbo Parts Co + Bosveld Bearings, ETA same-day dispatch.
              </p>
            </Card>
          </Screen>
        }
      />
      <Route
        path="/billing"
        element={
          <Screen title="Billing" subtitle="SaaS subscription management (not buyer checkout)">
            <Metrics
              items={[
                { label: "Plan", value: "Pro" },
                { label: "Status", value: "Active" },
                { label: "Next invoice", value: "R 9,900" },
                { label: "Renewal", value: "May 1" }
              ]}
            />
            <Card className="mt-4">
              <div className="flex gap-2">
                <Button>Upgrade plan</Button>
                <Button className="bg-slate-600 hover:bg-slate-500">Download invoice</Button>
              </div>
            </Card>
          </Screen>
        }
      />
      <Route
        path="/settings"
        element={
          <Screen title="Settings" subtitle="Operational settings for non-technical staff">
            <Table
              columns={["Area", "Current value", "Owner"]}
              rows={[
                ["VAT", "15% incl.", "Finance"],
                ["Low stock threshold", "8", "Operations"],
                ["Invoice prefix", "MSP", "Admin"],
                ["Order approval", "Required > R10k", "Manager"]
              ]}
            />
          </Screen>
        }
      />
      <Route
        path="/demo-flows"
        element={
          <Screen title="Demo flows" subtitle="Presentation-ready guided stories">
            <Card>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {demo.demoFlows.map((flow) => (
                  <li key={flow}>{flow}</li>
                ))}
              </ol>
            </Card>
          </Screen>
        }
      />
      <Route path="*" element={<Navigate to="/platform" replace />} />
    </Routes>
  );
}
