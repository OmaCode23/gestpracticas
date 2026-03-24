"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { INPUT_CLS } from "@/components/ui";

type LocalidadComboboxProps = {
  localidades: string[];
  value: string;
  onChange: (value: string) => void;
  size?: "form" | "filter";
  placeholder?: string;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getLetterLabel(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return normalized[0] ?? "#";
}

export default function LocalidadCombobox({
  localidades,
  value,
  onChange,
  size = "form",
  placeholder = "Busca una localidad...",
}: LocalidadComboboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveLetter(null);
        setQuery(value);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filteredLocalidades = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    let items = localidades;

    if (activeLetter) {
      items = items.filter((localidad) => getLetterLabel(localidad) === activeLetter);
    }

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((localidad) =>
      normalizeText(localidad).includes(normalizedQuery)
    );
  }, [activeLetter, localidades, query]);

  const handleSelect = (localidad: string) => {
    onChange(localidad);
    setQuery(localidad);
    setIsOpen(false);
  };

  const handleLetterClick = (letter: string) => {
    setActiveLetter((current) => (current === letter ? null : letter));
    setIsOpen(true);
  };

  const inputClassName =
    size === "filter"
      ? "w-full rounded-[7px] border-[1.5px] border-border bg-surface px-2.5 py-1.5 pr-10 text-[0.8rem] text-[#1a1f36] outline-none transition-colors placeholder:text-text-light focus:border-blue-light"
      : `${INPUT_CLS} pr-10`;

  const clearButtonClassName =
    size === "filter"
      ? "absolute right-2 top-1/2 flex h-7 min-w-7 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-surface2 px-1.5 text-[0.82rem] font-bold text-text-mid shadow-sm transition-all hover:border-blue-light hover:bg-white hover:text-navy"
      : "absolute right-2 top-1/2 flex h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-surface2 px-2 text-[0.95rem] font-bold text-text-mid shadow-sm transition-all hover:border-blue-light hover:bg-white hover:text-navy";

  const letterButtonClassName =
    size === "filter"
      ? "h-6 min-w-6 rounded-md border px-1 text-[0.64rem] font-semibold transition-colors"
      : "h-7 min-w-7 rounded-md border px-1.5 text-[0.68rem] font-semibold transition-colors";

  const optionClassName =
    size === "filter"
      ? "block w-full px-3 py-2 text-left text-[0.78rem] transition-colors"
      : "block w-full px-3 py-2 text-left text-[0.82rem] transition-colors";

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          className={inputClassName}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveLetter(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveLetter(null);
              setIsOpen(true);
              onChange("");
            }}
            className={clearButtonClassName}
            aria-label="Limpiar localidad"
            title="Limpiar localidad"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-border bg-white shadow-card">
          <div className="border-b border-border px-3 py-2">
            <div className="flex flex-wrap gap-1.5">
              {LETTERS.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => handleLetterClick(letter)}
                  className={[
                    letterButtonClassName,
                    activeLetter === letter
                      ? "border-blue-light bg-blue-light text-white"
                      : "border-border bg-white text-text-mid hover:border-blue-light hover:text-blue-600",
                  ].join(" ")}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-2">
            {filteredLocalidades.length === 0 ? (
              <p className="px-3 py-2 text-[0.8rem] text-text-light">
                No se encontraron localidades.
              </p>
            ) : (
              filteredLocalidades.map((localidad) => (
                <button
                  key={localidad}
                  type="button"
                  onClick={() => handleSelect(localidad)}
                  className={[
                    optionClassName,
                    localidad === value
                      ? "bg-blue-50 text-blue-700"
                      : "text-navy hover:bg-surface",
                  ].join(" ")}
                >
                  {localidad}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
