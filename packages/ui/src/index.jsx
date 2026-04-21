import React from "react";

export function Button({ className = "", children, ...props }) {
  return (
    <button
      className={`inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Input(props) {
  return (
    <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...props} />
  );
}

export function PageTitle({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
    </div>
  );
}
