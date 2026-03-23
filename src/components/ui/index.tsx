import React from "react";

// ─── BADGE ────────────────────────────────────────────────────
export type BadgeVariant =
  | "blue"
  | "green"
  | "amber"
  | "purple"
  | "red"
  | "gray"
  | "teal"
  | "pink"
  | "indigo"
  | "orange";

const BADGE_STYLES: Record<
  BadgeVariant,
  { backgroundColor: string; color: string; borderColor: string }
> = {
  blue:   { backgroundColor: "#eaf2ff", color: "#2457d6", borderColor: "#bfd3ff" },
  green:  { backgroundColor: "#dcfce7", color: "#15803d", borderColor: "#bbf7d0" },
  amber:  { backgroundColor: "#fef3c7", color: "#b45309", borderColor: "#fde68a" },
  purple: { backgroundColor: "#f3e8ff", color: "#7e22ce", borderColor: "#d8b4fe" },
  red:    { backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" },
  gray:   { backgroundColor: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" },
  teal:   { backgroundColor: "#e6fffb", color: "#0f766e", borderColor: "#99f6e4" },
  pink:   { backgroundColor: "#fdf2f8", color: "#be185d", borderColor: "#f9a8d4" },
  indigo: { backgroundColor: "#eef2ff", color: "#4338ca", borderColor: "#c7d2fe" },
  orange: { backgroundColor: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" },
};

export function Badge({ variant = "gray", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold leading-none shadow-sm"
      style={BADGE_STYLES[variant]}
    >
      {children}
    </span>
  );
}

// ─── BUTTON ───────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "danger" | "success" | "accent";
type BtnSize    = "sm" | "md";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary:   "bg-blue-light text-white hover:bg-blue hover:-translate-y-px",
  secondary: "bg-surface2 text-text-mid border border-border hover:bg-border",
  danger:    "bg-red-100 text-red-600 hover:bg-red-200",
  success:   "bg-green-100 text-green-700 hover:bg-green-200",
  accent:    "bg-accent text-navy hover:bg-[#d4922e]",
};

const BTN_SIZE: Record<BtnSize, string> = {
  sm: "px-3 py-1 text-[0.78rem]",
  md: "px-5 py-2 text-[0.85rem]",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold cursor-pointer transition-all duration-150 font-sans inline-flex items-center gap-1.5 border-0 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── CARD ─────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[14px] shadow-card border border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
      {children}
    </div>
  );
}

type IconVariant = "blue" | "green" | "amber" | "purple";
const ICON_CLASSES: Record<IconVariant, string> = {
  blue:   "bg-blue-100 text-blue-600",
  green:  "bg-green-100 text-green-600",
  amber:  "bg-amber-100 text-amber-600",
  purple: "bg-purple-100 text-purple-600",
};

export function CardTitle({ icon, iconVariant = "blue", children }: { icon: string; iconVariant?: IconVariant; children: React.ReactNode }) {
  return (
    <div className="text-[0.95rem] font-semibold text-navy flex items-center gap-2">
      <div className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-[0.85rem] ${ICON_CLASSES[iconVariant]}`}>
        {icon}
      </div>
      {children}
    </div>
  );
}

// ─── FORM HELPERS ─────────────────────────────────────────────
export function FormGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.78rem] font-semibold text-text-mid uppercase tracking-wider">{label}</label>
      {children}
      {error && <p className="text-red-500 text-[0.72rem] mt-0.5">{error}</p>}
    </div>
  );
}

export function FormRow({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };
  return <div className={`grid ${COLS[cols]} gap-4 mb-4`}>{children}</div>;
}

export const INPUT_CLS = "px-3 py-2 border-[1.5px] border-border rounded-lg text-sm text-[#1a1f36] bg-surface transition-colors outline-none focus:border-blue-light focus:bg-white w-full";

// ─── MISC ─────────────────────────────────────────────────────
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.75rem] font-medium text-text-mid bg-surface2 rounded px-2 py-0.5">
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[0.7rem] uppercase tracking-[0.1em] font-bold text-text-light mb-3.5">{children}</p>;
}

export function PageHeader({ breadcrumb, breadcrumbHighlight, title, subtitle }: {
  breadcrumb: string; breadcrumbHighlight: string; title: string; subtitle: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-[0.78rem] text-text-light mb-2">
        {breadcrumb} <span className="text-blue">{breadcrumbHighlight}</span>
      </p>
      <h1 className="font-display text-[1.75rem] text-navy font-bold leading-tight">{title}</h1>
      <p className="text-text-mid text-[0.9rem] mt-1.5">{subtitle}</p>
    </div>
  );
}

export function Alert({ variant = "info", children }: { variant?: "info" | "success"; children: React.ReactNode }) {
  const CLS = {
    info:    "bg-blue-50 text-blue-700 border border-blue-200",
    success: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <div className={`px-4 py-3 rounded-[9px] text-[0.84rem] flex items-center gap-2.5 mb-5 ${CLS[variant]}`}>
      {children}
    </div>
  );
}

export function TableFilters({ children }: { children: React.ReactNode }) {
  return <div className="px-6 py-4 flex gap-3 items-center border-b border-border flex-wrap">{children}</div>;
}

export function TdActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5">{children}</div>;
}
