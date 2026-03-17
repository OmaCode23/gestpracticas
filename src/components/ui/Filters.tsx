"use client";

import { INPUT_CLS } from "@/components/ui";

export function SearchBox({ value, onChange, placeholder = "Buscar..." }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-surface border-[1.5px] border-border rounded-[7px] px-2.5 py-1.5 flex-1 max-w-[220px]">
      <span className="text-text-light text-sm">🔍</span>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="border-0 bg-transparent text-[0.8rem] outline-none w-full text-[#1a1f36] placeholder:text-text-light"
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select
      value={value} onChange={e => onChange(e.target.value)}
      className="px-2.5 py-1.5 text-[0.8rem] rounded-[7px] bg-surface border-[1.5px] border-border text-[#1a1f36] cursor-pointer outline-none focus:border-blue-light w-auto"
    >
      {children}
    </select>
  );
}
