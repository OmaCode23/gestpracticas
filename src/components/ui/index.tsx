import React from "react";

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
  blue: { backgroundColor: "#f5dde4", color: "#8f1f3e", borderColor: "#e6c1cb" },
  green: { backgroundColor: "#e7efe7", color: "#46634d", borderColor: "#cbdccc" },
  amber: { backgroundColor: "#f7ead5", color: "#986333", borderColor: "#ead0ab" },
  purple: { backgroundColor: "#eee4ea", color: "#75495a", borderColor: "#d8c5ce" },
  red: { backgroundColor: "#fee2e2", color: "#b91c1c", borderColor: "#fca5a5" },
  gray: { backgroundColor: "#f3ece8", color: "#6d5a59", borderColor: "#dbc8c3" },
  teal: { backgroundColor: "#e4f0ec", color: "#3d6c63", borderColor: "#bdd8d0" },
  pink: { backgroundColor: "#f7e7ee", color: "#9b3158", borderColor: "#e9bfd0" },
  indigo: { backgroundColor: "#e8e6f2", color: "#564c81", borderColor: "#c9c3e2" },
  orange: { backgroundColor: "#faece1", color: "#a85b2a", borderColor: "#efc8a7" },
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

type BtnVariant = "primary" | "secondary" | "danger" | "success" | "accent";
type BtnSize = "sm" | "md";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-blue-light text-white hover:bg-blue hover:-translate-y-px",
  secondary: "border border-border bg-surface2 text-text-mid hover:bg-[#e5d7d0]",
  danger: "bg-red-100 text-red-600 hover:bg-red-200",
  success: "bg-green-100 text-green-700 hover:bg-green-200",
  accent: "bg-accent text-white hover:bg-[#851534]",
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
      className={`inline-flex items-center gap-1.5 rounded-lg border-0 font-sans font-semibold cursor-pointer transition-all duration-150 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glass-panel rounded-[20px] border border-white/70 bg-white/84 shadow-card ${className}`}>{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between border-b border-border px-6 pb-4 pt-5">{children}</div>;
}

type IconVariant = "blue" | "green" | "amber" | "purple";

const ICON_CLASSES: Record<IconVariant, string> = {
  blue: "bg-[#f5dde4] text-[#9f1d3e]",
  green: "bg-[#e7efe7] text-[#46634d]",
  amber: "bg-[#f7ead5] text-[#986333]",
  purple: "bg-[#eee4ea] text-[#75495a]",
};

export function CardTitle({ icon, iconVariant = "blue", children }: { icon: string; iconVariant?: IconVariant; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[0.95rem] font-semibold text-navy">
      <div className={`flex h-7 w-7 items-center justify-center rounded-[7px] text-[0.85rem] ${ICON_CLASSES[iconVariant]}`}>
        {icon}
      </div>
      {children}
    </div>
  );
}

export function FormGroup({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[0.78rem] font-semibold uppercase tracking-wider text-text-mid">{label}</label>
      {children}
      {error && <p className="mt-0.5 text-[0.72rem] text-red-500">{error}</p>}
    </div>
  );
}

export function FormRow({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  const COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };
  return <div className={`mb-4 grid ${COLS[cols]} gap-4`}>{children}</div>;
}

export const INPUT_CLS = "w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2 text-sm text-[#2b1c20] outline-none transition-colors focus:border-blue-light focus:bg-white";

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded bg-surface2 px-2 py-0.5 text-[0.75rem] font-medium text-text-mid">{children}</span>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-3.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-text-light">{children}</p>;
}

export function PageHeader({ breadcrumb, breadcrumbHighlight, title, subtitle }: {
  breadcrumb: string;
  breadcrumbHighlight: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[0.78rem] text-text-light">
        {breadcrumb} <span className="text-blue">{breadcrumbHighlight}</span>
      </p>
      <h1 className="font-display text-[1.75rem] font-bold leading-tight text-navy">{title}</h1>
      <p className="mt-1.5 text-[0.9rem] text-text-mid">{subtitle}</p>
    </div>
  );
}

export function Alert({ variant = "info", children }: { variant?: "info" | "success"; children: React.ReactNode }) {
  const CLS = {
    info: "border border-[#e6c1cb] bg-[#fbecf1] text-[#8f1f3e]",
    success: "border border-green-200 bg-green-50 text-green-700",
  };

  return <div className={`mb-5 flex items-center gap-2.5 rounded-[9px] px-4 py-3 text-[0.84rem] ${CLS[variant]}`}>{children}</div>;
}

export function TableFilters({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">{children}</div>;
}

export function TdActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5">{children}</div>;
}
