"use client";

import { INPUT_CLS } from "@/components/ui";

export function SearchBox({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-[7px] border-[1.5px] border-border bg-surface px-2.5 py-1.5 flex-1 max-w-[220px] ${className}`}
    >
      <span className="text-sm text-text-light">{"\u{1F50D}"}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-0 bg-transparent text-[0.8rem] text-[#1a1f36] outline-none placeholder:text-text-light"
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-auto cursor-pointer rounded-[7px] border-[1.5px] border-border bg-surface px-2.5 py-1.5 text-[0.8rem] text-[#1a1f36] outline-none focus:border-blue-light"
    >
      {children}
    </select>
  );
}
