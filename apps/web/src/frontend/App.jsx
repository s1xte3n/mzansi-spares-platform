import React from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";

const sideNav = [
  { icon: "dashboard", label: "Dashboard", path: "/dashboard" },
  { icon: "security", label: "Audit & Compliance", path: "/audit-compliance" },
  { icon: "store", label: "Spares Shops", path: "/spares-shops" },
  { icon: "support_agent", label: "Active Cases", path: "/active-cases" },
  { icon: "inventory_2", label: "Global Inventory", path: "/global-inventory" }
];

const caseRows = [
  ["CAS-4821", "Part Quality", "#ORD-552", "BP-7721 (Brake Pads)", "Goldwagen Pretoria", "critical", "Escalated", "Pieter Venter", "10m ago"],
  ["CAS-4790", "Inventory", "#ORD-548", "ALT-900 (Alternator)", "Midas Sandton", "medium", "In Progress", "Sarah Jenkins", "2h ago"],
  ["CAS-4785", "Fraud Detection", "#TRX-9901", "Multiple Items", "Joe's Spares Cape", "high", "Open", "Unassigned", "5h ago"]
];

const timeline = [
  ["primary", "Stock Adjusted", "By: Shop Manager (Goldwagen)", "Ref: BRK-OIL-5L", '"Inventory recount correction"'],
  ["error", "Order Cancelled", "By: System Agent", "Ref: #ORD-9902", "Reason: Quality Dispute Escalation"],
  ["bright", "Price Changed", "By: Admin (Pieter Venter)", "Ref: TIM-BELT-VW", "Manual override for loyalty credit"]
];

const sectionContent = {
  dashboard: {
    title: "Dashboard",
    description: "Live operational view across support, stock movement, and marketplace risk posture.",
    stats: [["Open Alerts", "14"], ["Orders Today", "328"], ["SLA Breaches", "2"]]
  },
  shops: {
    title: "Spares Shops",
    description: "Monitor onboarding quality, catalog readiness, and risk indicators per merchant.",
    stats: [["Active Shops", "186"], ["Pending KYC", "11"], ["Flagged Shops", "5"]]
  },
  cases: {
    title: "Active Cases",
    description: "Track current disputes and escalations that require intervention.",
    stats: [["Open Cases", "64"], ["Escalated", "9"], ["Awaiting Vendor", "17"]]
  },
  inventory: {
    title: "Global Inventory",
    description: "Cross-tenant inventory visibility for constrained parts and abnormal stock swings.",
    stats: [["Low Stock SKUs", "43"], ["Backorders", "18"], ["At Risk Today", "7"]]
  }
};

function SectionPage({ pageKey }) {
  const content = sectionContent[pageKey];

  return (
    <section className="rounded-xl border border-[#05183c] bg-[#06122d] p-8">
      <h2 className="font-[Manrope] text-2xl font-bold tracking-tight">{content.title}</h2>
      <p className="mt-2 text-sm text-[#91aaeb]">{content.description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {content.stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-[#05183c] p-4">
            <div className="text-xs uppercase tracking-wider text-[#91aaeb]">{label}</div>
            <div className="mt-2 font-[Manrope] text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-[#05183c] p-4 text-sm text-[#91aaeb]">
        This content is now route-wired and can be expanded with the full page-specific modules.
      </div>
    </section>
  );
}

function AuditCompliancePage() {
  return (
    <main className="relative flex h-full flex-1 space-x-6 overflow-y-auto p-8">
      <div className="flex h-full min-w-0 flex-1 flex-col space-y-6">
        <div className="flex-shrink-0"><h2 className="mb-1 font-[Manrope] text-3xl font-bold tracking-tight">Support Marketplace Oversight</h2><p className="text-sm text-[#91aaeb]">Resolving South African spares shop disputes, inventory discrepancies, and compliance audits</p></div>

        <div className="grid flex-shrink-0 grid-cols-3 gap-4">
          <div className="relative overflow-hidden rounded-xl bg-[#06122d] p-5"><div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-[#05183c] opacity-50 blur-2xl" /><div className="relative z-10 mb-4 flex items-start justify-between"><span className="text-xs uppercase tracking-wider text-[#91aaeb]">Active Disputes</span><span className="material-symbols-outlined text-sm text-[#5b74b1]">shopping_cart_checkout</span></div><div className="relative z-10 flex items-baseline space-x-2"><span className="font-[Manrope] text-3xl font-bold">64</span><span className="flex items-center text-xs font-medium text-[#ec7c8a]"><span className="material-symbols-outlined mr-0.5 text-[0.8rem]">trending_up</span>8%</span></div></div>
          <div className="relative overflow-hidden rounded-xl border-l-2 border-[#7f2737] bg-[#06122d] p-5"><div className="relative z-10 mb-4 flex items-start justify-between"><span className="text-xs uppercase tracking-wider text-[#91aaeb]">High Risk Shops</span><span className="material-symbols-outlined text-sm text-[#b95463]">report</span></div><div className="relative z-10 flex items-baseline space-x-2"><span className="font-[Manrope] text-3xl font-bold">5</span><span className="text-xs font-medium text-[#b95463]">AutoZone Group</span></div></div>
          <div className="relative overflow-hidden rounded-xl bg-[#06122d] p-5"><div className="relative z-10 mb-4 flex items-start justify-between"><span className="text-xs uppercase tracking-wider text-[#91aaeb]">Quality Audits</span><span className="material-symbols-outlined text-sm text-[#acb3ff]">verified</span></div><div className="relative z-10 flex items-baseline space-x-2"><span className="font-[Manrope] text-3xl font-bold">112</span><span className="text-xs font-medium text-[#91aaeb]">Last 48h</span></div></div>
        </div>

        <div className="flex flex-shrink-0 items-center space-x-3 rounded-lg bg-[#06122d] p-3"><div className="relative flex-1"><span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#91aaeb]">filter_list</span><input className="w-full rounded-md border border-[#2b4680]/20 bg-[#060e20] py-1.5 pl-9 pr-4 text-sm text-[#dee5ff] placeholder:text-[#91aaeb]/50 focus:border-[#2b4680]/60 focus:outline-none" placeholder="Search Case ID, Order ID, Part #, or Shop Name..." type="text" /></div><div className="flex space-x-2"><button className="flex items-center space-x-1 rounded-md border border-[#2b4680]/20 bg-[#060e20] px-3 py-1.5 text-xs text-[#91aaeb] transition-colors hover:text-[#dee5ff]"><span>Type</span><span className="material-symbols-outlined text-[1rem]">arrow_drop_down</span></button><button className="flex items-center space-x-1 rounded-md border border-[#2b4680]/20 bg-[#060e20] px-3 py-1.5 text-xs text-[#91aaeb] transition-colors hover:text-[#dee5ff]"><span>Status</span><span className="material-symbols-outlined text-[1rem]">arrow_drop_down</span></button><button className="flex items-center space-x-1 rounded-md border border-[#2b4680]/20 bg-[#060e20] px-3 py-1.5 text-xs text-[#91aaeb] transition-colors hover:text-[#dee5ff]"><span>Assignee</span><span className="material-symbols-outlined text-[1rem]">arrow_drop_down</span></button><button className="flex items-center space-x-1 rounded-md border border-[#2b4680]/20 bg-[#060e20] px-3 py-1.5 text-xs text-[#91aaeb] transition-colors hover:text-[#dee5ff]"><span className="material-symbols-outlined mr-1 text-[0.9rem]">calendar_today</span><span>This Month</span></button></div></div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#06122d]">
          <div className="flex items-center justify-between border-b border-[#05183c] bg-[#05183c] px-5 py-4"><h3 className="text-sm font-semibold">Active Support Cases</h3><button className="flex items-center text-xs text-[#bdc2ff] transition-colors hover:text-[#acb3ff]"><span className="material-symbols-outlined mr-1 text-[1rem]">download</span>Export Registry</button></div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="min-w-[1200px] w-full border-collapse text-left"><thead className="sticky top-0 z-10 bg-[#06122d]/90 backdrop-blur-md"><tr>{["Case ID","Type","Reference","Spares Shop","Severity","Status","Assigned","Last Updated","Actions"].map((h)=><th key={h} className={`px-5 py-3 text-[0.65rem] uppercase tracking-widest text-[#91aaeb] ${h==='Actions'?'text-right':''}`}>{h}</th>)}</tr></thead><tbody className="divide-y divide-[#060e20]/50 text-sm">{caseRows.map(([id,type,ref,part,shop,severity,status,assignee,updated],idx)=><tr key={id} className={`group cursor-pointer transition-colors hover:bg-[#00225a]/40 ${idx===0?'bg-[#00225a]/40':''}`}><td className="px-5 py-3 font-mono text-xs">{id}</td><td className="px-5 py-3">{type}</td><td className="px-5 py-3"><div className="text-xs">{ref}</div><div className="font-mono text-[0.65rem] text-[#acb3ff]">{part}</div></td><td className="px-5 py-3"><div className="flex items-center space-x-1.5"><span>{shop}</span>{idx===0?<span className="material-symbols-outlined text-[1rem] text-[#ec7c8a]" title="Repeated disputes">warning</span>:null}</div></td><td className="px-5 py-3"><span className={`inline-flex rounded px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ${severity==='critical'?'bg-[#7f2737] text-[#ff97a3]':severity==='medium'?'border border-[#2b4680]/30 bg-[#031d4b] text-[#91aaeb]':'border border-[#2b4680]/30 bg-[#00225a] text-[#bdc2ff]'}`}>{severity}</span></td><td className="px-5 py-3"><span className={`${status==='Escalated'?'text-[#b95463]':status==='In Progress'?'text-[#acb3ff]':'text-[#dee5ff]'} font-medium`}>{status}</span></td><td className="px-5 py-3 text-[#91aaeb]">{assignee}</td><td className="px-5 py-3 font-mono text-[0.7rem] text-[#91aaeb]">{updated}</td><td className="px-5 py-3 text-right"><div className="flex justify-end space-x-2"><button className="p-1 transition-colors hover:text-[#bdc2ff]" title="View Case"><span className="material-symbols-outlined text-lg">visibility</span></button><button className="p-1 transition-colors hover:text-[#bdc2ff]" title="Assign"><span className="material-symbols-outlined text-lg">person_add</span></button><button className="p-1 transition-colors hover:text-[#bdc2ff]" title="More Actions"><span className="material-symbols-outlined text-lg">more_vert</span></button></div></td></tr>)}</tbody></table>
          </div>
        </div>
      </div>

      <div className="flex h-full w-80 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-[#05183c] bg-[#06122d] shadow-[0px_24px_48px_rgba(5,24,60,0.1)]">
        <div className="flex items-start justify-between border-b border-[#060e20] bg-[#05183c]/50 p-5"><div><div className="mb-1 flex items-center space-x-2"><span className="inline-flex rounded bg-[#7f2737] px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-[#ff97a3]">Audit Log</span><span className="font-mono text-xs text-[#91aaeb]">EVT-99214</span></div><h3 className="mt-2 text-base font-semibold leading-tight">Manual Correction</h3><div className="mt-1 text-xs text-[#91aaeb]">2023-11-12 14:32 SAST</div></div><button className="text-[#91aaeb] transition-colors hover:text-[#dee5ff]"><span className="material-symbols-outlined text-lg">refresh</span></button></div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="space-y-4"><h4 className="border-b border-[#05183c] pb-2 text-xs uppercase tracking-[0.05em] text-[#91aaeb]">Recent Shop Activity</h4>{timeline.map(([tone,title,by,ref,note],i)=><div key={title} className={`relative pl-6 ${i<timeline.length-1?'border-l border-[#2b4680]/30 pb-4':''}`}><div className={`absolute left-[-5px] top-1 h-2 w-2 rounded-full ${tone==='primary'?'bg-[#bdc2ff] shadow-[0_0_8px_#bdc2ff]':tone==='error'?'bg-[#b95463]':'bg-[#002867]'}`} /><div className="text-xs font-medium">{title}</div><div className="mt-0.5 text-[0.65rem] text-[#91aaeb]">{by}</div><div className="mt-1 font-mono text-[0.65rem] text-[#acb3ff]">{ref}</div><div className="mt-1 text-[0.65rem] italic text-[#5b74b1]">{note}</div></div>)}</div>
          <div className="space-y-4"><h4 className="border-b border-[#05183c] pb-2 text-xs uppercase tracking-[0.05em] text-[#91aaeb]">Shop Risk Context</h4><div className="rounded-lg bg-[#05183c] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-xs text-[#91aaeb]">Merchant Score</span><span className="text-xs font-bold text-[#ec7c8a]">42/100</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-[#031d4b]"><div className="h-full bg-[#ec7c8a]" style={{ width: "42%" }} /></div><div className="mt-3 text-[0.65rem] leading-relaxed text-[#91aaeb]">Goldwagen Pretoria has 3 unresolved disputes regarding brake component authenticity in the last 7 days.</div></div></div>
        </div>
        <div className="flex flex-col space-y-2 border-t border-[#060e20] bg-[#06122d] p-4"><button className="w-full rounded-lg bg-gradient-to-br from-[#bdc2ff] to-[#2f3aa3] py-2 text-sm font-semibold text-[#28329c] shadow-md transition-opacity hover:opacity-90">Initiate Store Audit</button><button className="w-full rounded-lg border border-[#2b4680]/20 bg-[#00225a] py-2 text-sm font-medium transition-colors hover:bg-[#002867]">Download Shop Log</button></div>
      </div>
    </main>
  );
}

export function App() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-[#060e20] font-[Inter] text-[#dee5ff] antialiased">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-shrink-0 flex-col space-y-4 bg-[#06122d] py-6">
        <div className="flex items-center space-x-3 px-6 pb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#bdc2ff] to-[#2f3aa3]"><span className="material-symbols-outlined text-sm font-bold text-[#28329c]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_car</span></div>
          <div><div className="font-['Manrope'] text-xl font-bold leading-tight tracking-tighter text-[#dee5ff]">Spares OS</div><div className="mt-0.5 text-[0.65rem] uppercase tracking-widest text-[#91aaeb]">ZA Marketplace Admin</div></div>
        </div>

        <div className="mb-4 px-4"><button className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-br from-[#bdc2ff] to-[#2f3aa3] px-4 py-2.5 text-[#28329c] shadow-[0px_8px_16px_rgba(47,58,163,0.3)] transition-opacity hover:opacity-90"><span className="material-symbols-outlined text-lg">add</span><span className="text-sm tracking-wide">New Support Case</span></button></div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {sideNav.map(({ icon, label, path }) => (
            <NavLink
              key={label}
              className={({ isActive }) => `group mx-2 flex items-center space-x-3 rounded-lg px-4 py-2.5 transition-colors duration-200 ${isActive ? "bg-[#00225a] font-semibold text-[#dee5ff]" : "text-[#91aaeb] hover:bg-[#05183c] hover:text-[#dee5ff]"}`}
              to={path}
            >
              {({ isActive }) => (
                <>
                  <span className="material-symbols-outlined text-[1.2rem] transition-colors group-hover:text-[#bdc2ff]" style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
                  <span className="text-sm tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 px-2"><a className="group mx-2 flex items-center space-x-3 rounded-lg px-4 py-2 text-[#91aaeb] transition-colors duration-200 hover:bg-[#05183c] hover:text-[#dee5ff]" href="#"><span className="material-symbols-outlined text-[1.1rem] transition-colors group-hover:text-[#bdc2ff]">settings</span><span className="text-sm tracking-wide">Settings</span></a></div>
      </aside>

      <div className="ml-64 flex h-screen min-h-screen flex-1 flex-col overflow-hidden bg-[#060e20]">
        <header className="z-40 flex h-16 w-full flex-shrink-0 items-center justify-between bg-[#060e20]/80 px-8 shadow-[0px_24px_48px_rgba(5,24,60,0.2)] backdrop-blur-xl">
          <div className="flex items-center space-x-8"><h1 className="hidden text-lg font-bold tracking-tight text-[#bdc2ff]">Support &amp; Audit</h1></div>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/audit-compliance" replace />} />
          <Route path="/dashboard" element={<main className="p-8"><SectionPage pageKey="dashboard" /></main>} />
          <Route path="/audit-compliance" element={<AuditCompliancePage />} />
          <Route path="/spares-shops" element={<main className="p-8"><SectionPage pageKey="shops" /></main>} />
          <Route path="/active-cases" element={<main className="p-8"><SectionPage pageKey="cases" /></main>} />
          <Route path="/global-inventory" element={<main className="p-8"><SectionPage pageKey="inventory" /></main>} />
          <Route path="*" element={<Navigate to="/audit-compliance" replace />} />
        </Routes>
      </div>
    </div>
  );
}
