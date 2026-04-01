"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoInstitutoTransparente from "@/app/images/logo_instituto_transparente.png";
import { Card, CardHeader, CardTitle, PageHeader, SectionLabel } from "@/components/ui";
import LocalidadCombobox from "@/modules/empresas/components/LocalidadCombobox";
import {
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
  getCursosAcademicos,
} from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";

type ReportKey = "alumnos" | "empresas" | "formacion";
type RowValue = string | number | null | undefined;
type ReportRow = Record<string, RowValue>;
type ReportColumn = { key: string; label: string };
type ReportFilter = { key: string; label: string; type: "select" | "text" };
type ReportConfig = {
  key: ReportKey;
  title: string;
  icon: string;
  iconVariant: "blue" | "green" | "amber";
  description: string;
  columns: ReportColumn[];
  filters: ReportFilter[];
};
type SupportOptions = {
  ciclos: string[];
  cursos: string[];
  sectores: string[];
  localidades: string[];
  empresaCiclos: string[];
};

const REPORT_CONFIGS: ReportConfig[] = [
  {
    key: "alumnos",
    title: "Informe de Alumnos",
    icon: "\u{1F393}",
    iconVariant: "blue",
    description:
      "Configura qué columnas quieres mostrar y qué filtros deben intervenir antes de generar el informe.",
    columns: [
      { key: "nombre", label: "Nombre" },
      { key: "nia", label: "NIA" },
      { key: "nif", label: "NIF" },
      { key: "nuss", label: "NUSS" },
      { key: "telefono", label: "Teléfono" },
      { key: "email", label: "Correo" },
      { key: "ciclo", label: "Ciclo formativo" },
      { key: "cursoCiclo", label: "Curso ciclo" },
      { key: "curso", label: "Curso académico" },
    ],
    filters: [
      { key: "search", label: "Búsqueda por nombre o NIA", type: "text" },
      { key: "ciclo", label: "Ciclo formativo", type: "select" },
      { key: "curso", label: "Curso académico", type: "select" },
    ],
  },
  {
    key: "empresas",
    title: "Informe de Empresas",
    icon: "\u{1F3E2}",
    iconVariant: "green",
    description:
      "Elige campos y filtros para construir informes abiertos del directorio de empresas colaboradoras.",
    columns: [
      { key: "nombre", label: "Nombre" },
      { key: "cif", label: "CIF" },
      { key: "direccion", label: "Dirección" },
      { key: "localidad", label: "Localidad" },
      { key: "sector", label: "Sector" },
      { key: "cicloFormativo", label: "Ciclo formativo" },
      { key: "telefono", label: "Teléfono" },
      { key: "email", label: "Correo empresa" },
      { key: "contacto", label: "Contacto" },
      { key: "emailContacto", label: "Correo contacto" },
    ],
    filters: [
      { key: "search", label: "Búsqueda por nombre o CIF", type: "text" },
      { key: "sector", label: "Sector", type: "select" },
      { key: "localidad", label: "Localidad", type: "select" },
      { key: "cicloFormativo", label: "Ciclo formativo", type: "select" },
    ],
  },
  {
    key: "formacion",
    title: "Informe de Formación en Empresa",
    icon: "\u{1F4CB}",
    iconVariant: "amber",
    description:
      "Activa solo los filtros que necesites y decide qué campos deben aparecer en el informe final.",
    columns: [
      { key: "empresaNombre", label: "Empresa" },
      { key: "empresaSector", label: "Sector empresa" },
      { key: "empresaLocalidad", label: "Localidad empresa" },
      { key: "empresaCicloFormativo", label: "Ciclo formativo empresa" },
      { key: "alumnoNombre", label: "Alumno" },
      { key: "alumnoNia", label: "NIA" },
      { key: "alumnoNif", label: "NIF" },
      { key: "alumnoNuss", label: "NUSS" },
      { key: "alumnoCiclo", label: "Ciclo formativo alumno" },
      { key: "alumnoCursoCiclo", label: "Curso ciclo alumno" },
      { key: "curso", label: "Curso académico" },
      { key: "periodo", label: "Periodo" },
      { key: "descripcion", label: "Descripción" },
      { key: "tutorLaboral", label: "Tutor laboral" },
      { key: "emailTutorLaboral", label: "Correo tutor laboral" },
    ],
    filters: [
      { key: "search", label: "Búsqueda libre", type: "text" },
      { key: "curso", label: "Curso académico", type: "select" },
      { key: "empresaNombre", label: "Empresa", type: "text" },
      { key: "alumnoNombre", label: "Alumno", type: "text" },
      { key: "empresaSector", label: "Sector empresa", type: "select" },
      { key: "empresaLocalidad", label: "Localidad empresa", type: "select" },
      { key: "empresaCicloFormativo", label: "Ciclo formativo empresa", type: "select" },
      { key: "alumnoCiclo", label: "Ciclo formativo alumno", type: "select" },
    ],
  },
];

const DEFAULT_COLUMNS: Record<ReportKey, string[]> = {
  alumnos: ["nombre", "nia", "ciclo", "curso"],
  empresas: ["nombre", "cif", "sector", "localidad"],
  formacion: ["empresaNombre", "alumnoNombre", "curso", "periodo", "tutorLaboral"],
};

const DEFAULT_FILTER_KEYS: Record<ReportKey, string[]> = {
  alumnos: ["ciclo", "curso"],
  empresas: ["sector", "localidad", "cicloFormativo"],
  formacion: ["curso", "empresaNombre", "alumnoNombre", "empresaCicloFormativo"],
};

const EMPTY_FILTER_VALUES: Record<string, string> = {};

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => (value ?? "").trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "es")
  );
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatCellValue(value: RowValue) {
  const normalized = String(value ?? "").trim();
  return normalized || "—";
}

function formatCursoCicloValue(value?: number | null) {
  return value === 1 || value === 2 ? `${value}º` : "";
}

function getFilterOptions(key: string, options: SupportOptions) {
  switch (key) {
    case "curso":
      return options.cursos;
    case "ciclo":
    case "alumnoCiclo":
      return options.ciclos;
    case "sector":
    case "empresaSector":
      return options.sectores;
    case "localidad":
    case "empresaLocalidad":
      return options.localidades;
    case "cicloFormativo":
    case "empresaCicloFormativo":
      return options.empresaCiclos;
    default:
      return [];
  }
}

function humanizeFilterKey(key: string) {
  const labels: Record<string, string> = {
    search: "Búsqueda",
    ciclo: "Ciclo formativo",
    curso: "Curso académico",
    sector: "Sector",
    localidad: "Localidad",
    cicloFormativo: "Ciclo formativo",
    empresaNombre: "Empresa",
    alumnoNombre: "Alumno",
    empresaSector: "Sector empresa",
    empresaLocalidad: "Localidad empresa",
    empresaCicloFormativo: "Ciclo formativo empresa",
    alumnoCiclo: "Ciclo formativo alumno",
  };
  return labels[key] ?? key;
}

export default function InformesPanel() {
  const [activeReportKey, setActiveReportKey] = useState<ReportKey | null>(null);
  const [openMode, setOpenMode] = useState<"complete" | "filtered" | null>(null);
  const [supportOptions, setSupportOptions] = useState<SupportOptions>({
    ciclos: [],
    cursos: getCursosAcademicos(),
    sectores: [],
    localidades: [],
    empresaCiclos: [],
  });

  const activeConfig = useMemo(
    () => REPORT_CONFIGS.find((config) => config.key === activeReportKey) ?? null,
    [activeReportKey]
  );

  useEffect(() => {
    void loadSupportOptions().then(setSupportOptions).catch((error) => {
      console.error("[Informes] No se pudieron cargar las opciones de soporte", error);
    });
  }, []);

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Informes"
        title="Informes"
        subtitle="Centraliza la generación de informes de alumnos, empresas y formación en empresa."
      />

      <SectionLabel>Áreas Disponibles</SectionLabel>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {REPORT_CONFIGS.map((card) => (
          <Card key={card.key} className="h-full">
            <CardHeader>
              <CardTitle icon={card.icon} iconVariant={card.iconVariant}>
                {card.title}
              </CardTitle>
            </CardHeader>
            <div className="px-6 py-5">
              <p className="text-[0.88rem] leading-relaxed text-text-mid">{card.description}</p>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveReportKey(card.key);
                    setOpenMode("complete");
                  }}
                  className="flex w-full items-center justify-between rounded-[10px] border border-border bg-surface px-3 py-2.5 text-left text-[0.82rem] font-medium text-navy transition-colors hover:border-blue-light hover:bg-surface2"
                >
                  <span>Informe completo</span>
                  <span className="text-text-light">{">"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveReportKey(card.key);
                    setOpenMode("filtered");
                  }}
                  className="flex w-full items-center justify-between rounded-[10px] border border-border bg-surface px-3 py-2.5 text-left text-[0.82rem] font-medium text-navy transition-colors hover:border-blue-light hover:bg-surface2"
                >
                  <span>Informe por filtrado</span>
                  <span className="text-text-light">{">"}</span>
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {activeConfig ? (
        <ReportBuilderModal
          config={activeConfig}
          mode={openMode ?? "filtered"}
          supportOptions={supportOptions}
          onClose={() => {
            setActiveReportKey(null);
            setOpenMode(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ReportBuilderModal({
  config,
  mode,
  supportOptions,
  onClose,
}: {
  config: ReportConfig;
  mode: "complete" | "filtered";
  supportOptions: SupportOptions;
  onClose: () => void;
}) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMNS[config.key]);
  const [enabledFilters, setEnabledFilters] = useState<string[]>(DEFAULT_FILTER_KEYS[config.key]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(EMPTY_FILTER_VALUES);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const isCompleteMode = mode === "complete";

  const visibleColumns = useMemo(
    () => config.columns.filter((column) => selectedColumns.includes(column.key)),
    [config.columns, selectedColumns]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        enabledFilters.every((filterKey) => {
          const filterValue = (filterValues[filterKey] ?? "").trim();
          if (!filterValue) return true;
          const currentValue = String(row[filterKey] ?? "");
          const filterConfig = config.filters.find((filter) => filter.key === filterKey);
          return filterConfig?.type === "select"
            ? normalizeText(currentValue) === normalizeText(filterValue)
            : normalizeText(currentValue).includes(normalizeText(filterValue));
        })
      ),
    [config.filters, enabledFilters, filterValues, rows]
  );

  useEffect(() => {
    setSelectedColumns(mode === "complete" ? config.columns.map((column) => column.key) : DEFAULT_COLUMNS[config.key]);
    setEnabledFilters(mode === "complete" ? [] : DEFAULT_FILTER_KEYS[config.key]);
    setFilterValues({});
    setRows([]);
    setError("");
    setHasLoaded(false);
  }, [config, mode]);

  useEffect(() => {
    if (!isCompleteMode) return;
    void loadRows();
  }, [config.key, isCompleteMode]);

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchReportRows(config.key));
      setHasLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo generar el informe.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 px-4 py-6" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[18px] border border-border bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <h3 className="text-[1.05rem] font-semibold text-navy">{config.title}</h3>
            <p className="mt-1 max-w-3xl text-[0.82rem] text-text-mid">
              {mode === "complete"
                ? "Genera una vista completa del informe y ajusta solo las columnas que quieras mostrar."
                : "Selecciona qué columnas quieres ver, activa los filtros necesarios y genera una vista previa abierta del informe."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-[0.78rem] font-semibold text-text-mid transition-colors hover:bg-surface"
          >
            Cerrar
          </button>
        </div>

        <div className={isCompleteMode ? "block" : "grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]"}>
          {!isCompleteMode ? (
            <div className="max-h-[80vh] overflow-y-auto border-r border-border bg-surface px-5 py-5">
              <BuilderSection title="Columnas del informe" subtitle="Marca los campos que deben aparecer en el resultado.">
                <div className="space-y-2">
                  {config.columns.map((column) => (
                    <CheckboxRow
                      key={column.key}
                      label={column.label}
                      checked={selectedColumns.includes(column.key)}
                      onChange={() =>
                        setSelectedColumns((current) =>
                          current.includes(column.key)
                            ? current.length === 1
                              ? current
                              : current.filter((key) => key !== column.key)
                            : [...current, column.key]
                        )
                      }
                    />
                  ))}
                </div>
              </BuilderSection>

              <BuilderSection title="Filtros disponibles" subtitle="Activa solo los filtros que quieras usar para este informe.">
                <div className="space-y-2">
                  {config.filters.map((filter) => (
                    <CheckboxRow
                      key={filter.key}
                      label={filter.label}
                      checked={enabledFilters.includes(filter.key)}
                      onChange={() =>
                        setEnabledFilters((current) =>
                          current.includes(filter.key)
                            ? current.filter((key) => key !== filter.key)
                            : [...current, filter.key]
                        )
                      }
                    />
                  ))}
                </div>
              </BuilderSection>

              <BuilderSection title="Valores de filtro" subtitle="Solo se aplican los filtros que estén activados.">
                <div className="space-y-3">
                  {config.filters
                    .filter((filter) => enabledFilters.includes(filter.key))
                    .map((filter) => (
                      <FilterInput
                        key={filter.key}
                        filter={filter}
                        options={getFilterOptions(filter.key, supportOptions)}
                        value={filterValues[filter.key] ?? ""}
                        onChange={(value) =>
                          setFilterValues((current) => ({ ...current, [filter.key]: value }))
                        }
                      />
                    ))}
                </div>
              </BuilderSection>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadRows}
                  className="rounded-[10px] bg-blue px-4 py-2 text-[0.82rem] font-semibold text-white transition-all hover:-translate-y-px hover:opacity-95"
                >
                  {loading ? "Generando..." : "Generar informe"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedColumns(DEFAULT_COLUMNS[config.key]);
                    setEnabledFilters(DEFAULT_FILTER_KEYS[config.key]);
                    setFilterValues({});
                  }}
                  className="rounded-[10px] border border-border bg-white px-4 py-2 text-[0.82rem] font-semibold text-text-mid transition-colors hover:bg-surface"
                >
                  Restablecer
                </button>
              </div>
            </div>
          ) : null}

          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {!isCompleteMode ? <StatusPill label={`${selectedColumns.length} columna(s)`} /> : null}
              {mode === "filtered" ? <StatusPill label={`${enabledFilters.length} filtro(s) activos`} /> : null}
              {isCompleteMode ? <StatusPill label="Informe completo" /> : null}
              {hasLoaded ? <StatusPill label={`${filteredRows.length} registro(s)`} /> : null}
            </div>

            {hasLoaded && filteredRows.length > 0 && visibleColumns.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadPdfReport({
                      title: config.title,
                      mode,
                      columns: visibleColumns,
                      rows: filteredRows,
                      enabledFilters,
                      filterValues,
                    })
                  }
                  className="rounded-[10px] border border-border bg-white px-4 py-2 text-[0.82rem] font-semibold text-navy transition-colors hover:bg-surface"
                >
                  Descargar PDF
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[0.8rem] text-red-700">
                {error}
              </div>
            ) : null}

            {!hasLoaded ? (
              <EmptyState
                title="Informe aún no generado"
                description="Configura columnas y filtros en la izquierda, y después pulsa en Generar informe."
              />
            ) : visibleColumns.length === 0 ? (
              <EmptyState
                title="No hay columnas seleccionadas"
                description="Selecciona al menos una columna para poder mostrar la vista previa."
              />
            ) : filteredRows.length === 0 ? (
              <EmptyState
                title="No hay resultados"
                description="Con la configuración actual no hay registros que encajen con los filtros activos."
              />
            ) : (
              <ReportTable visibleColumns={visibleColumns} filteredRows={filteredRows} configKey={config.key} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuilderSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <h4 className="text-[0.82rem] font-semibold text-navy">{title}</h4>
      <p className="mb-3 mt-1 text-[0.75rem] leading-relaxed text-text-light">{subtitle}</p>
      {children}
    </section>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-border bg-white px-3 py-2 text-[0.8rem] text-text-mid transition-colors hover:bg-surface2">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

function FilterInput({
  filter,
  options,
  value,
  onChange,
}: {
  filter: ReportFilter;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.74rem] font-semibold uppercase tracking-[0.06em] text-text-light">
        {filter.label}
      </span>
      {filter.key === "localidad" || filter.key === "empresaLocalidad" ? (
        <LocalidadCombobox
          localidades={options}
          value={value}
          onChange={onChange}
          size="filter"
          placeholder="Busca una localidad..."
        />
      ) : filter.type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[0.82rem] text-text-mid outline-none transition-colors focus:border-blue-light"
        >
          <option value="">Todos</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Escribe para filtrar..."
          className="w-full rounded-[10px] border border-border bg-white px-3 py-2 text-[0.82rem] text-text-mid outline-none transition-colors focus:border-blue-light"
        />
      )}
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-surface px-3 py-1 text-[0.74rem] font-medium text-text-mid">
      {label}
    </span>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[12px] border border-dashed border-border bg-surface px-5 py-8 text-center">
      <p className="text-[0.9rem] font-semibold text-navy">{title}</p>
      <p className="mx-auto mt-2 max-w-2xl text-[0.82rem] leading-relaxed text-text-mid">{description}</p>
    </div>
  );
}

function ReportTable({
  visibleColumns,
  filteredRows,
  configKey,
}: {
  visibleColumns: ReportColumn[];
  filteredRows: ReportRow[];
  configKey: ReportKey;
}) {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const updateScrollState = () => {
      const table = tableScrollRef.current;
      if (!table) return;
      const maxScrollLeft = table.scrollWidth - table.clientWidth;
      setCanScrollLeft(table.scrollLeft > 4);
      setCanScrollRight(table.scrollLeft < maxScrollLeft - 4);
    };
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [visibleColumns, filteredRows]);

  const scrollTable = (direction: "left" | "right") => {
    const table = tableScrollRef.current;
    if (!table) return;
    const amount = Math.max(240, Math.round(table.clientWidth * 0.6));
    table.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-[12px] border border-border bg-surface px-3 py-2.5">
        <div>
          <p className="text-[0.78rem] font-semibold text-navy">Desplazamiento horizontal</p>
          <p className="text-[0.72rem] text-text-light">Usa los controles para moverte por las columnas del informe.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTable("left")}
            disabled={!canScrollLeft}
            className={`rounded-[10px] border px-3 py-2 text-[0.85rem] font-semibold transition-colors ${
              canScrollLeft ? "border-border bg-white text-navy hover:bg-surface2" : "cursor-not-allowed border-border/70 bg-white/70 text-text-light"
            }`}
          >
            {"<"}
          </button>
          <button
            type="button"
            onClick={() => scrollTable("right")}
            disabled={!canScrollRight}
            className={`rounded-[10px] border px-3 py-2 text-[0.85rem] font-semibold transition-colors ${
              canScrollRight ? "border-border bg-white text-navy hover:bg-surface2" : "cursor-not-allowed border-border/70 bg-white/70 text-text-light"
            }`}
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft ? <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent" /> : null}
        {canScrollRight ? <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent" /> : null}
        <div
          ref={tableScrollRef}
          onScroll={() => {
            const table = tableScrollRef.current;
            if (!table) return;
            const maxScrollLeft = table.scrollWidth - table.clientWidth;
            setCanScrollLeft(table.scrollLeft > 4);
            setCanScrollRight(table.scrollLeft < maxScrollLeft - 4);
          }}
          className="overflow-x-auto rounded-[12px] border border-border"
        >
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-surface">
                {visibleColumns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-border px-3 py-2 text-left text-[0.76rem] font-semibold uppercase tracking-[0.06em] text-text-light"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, index) => (
                <tr key={`${configKey}-${index}`} className="odd:bg-white even:bg-surface/40">
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className="border-b border-border px-3 py-2 text-[0.82rem] text-text-mid"
                    >
                      {formatCellValue(row[column.key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

async function loadSupportOptions(): Promise<SupportOptions> {
  const [ciclosResponse, settingsResponse, empresasResponse] = await Promise.all([
    fetch("/api/catalogos/ciclos-formativos", { cache: "no-store" }),
    fetch("/api/settings/academico", { cache: "no-store" }),
    fetch("/api/empresas?all=true", { cache: "no-store" }),
  ]);

  const ciclosJson: ApiResponse<Array<{ nombre: string; activo: boolean }>> = await ciclosResponse.json();
  const settingsJson: ApiResponse<{ mesCambioCurso: number; numeroCursosVisibles: number }> =
    await settingsResponse.json();
  const empresasJson: ApiResponse<{ items: Array<{ sector: string; localidad: string; cicloFormativo: string | null }> }> =
    await empresasResponse.json();

  const ciclos = ciclosJson.ok
    ? uniqueSorted(ciclosJson.data.filter((item) => item.activo).map((item) => item.nombre))
    : [];
  const cursos = settingsJson.ok
    ? getCursosAcademicos(settingsJson.data.numeroCursosVisibles, new Date(), settingsJson.data.mesCambioCurso)
    : getCursosAcademicos(DEFAULT_NUMERO_CURSOS_VISIBLES, new Date(), DEFAULT_MES_CAMBIO_CURSO);
  const sectores = empresasJson.ok ? uniqueSorted(empresasJson.data.items.map((item) => item.sector)) : [];
  const localidades = empresasJson.ok ? uniqueSorted(empresasJson.data.items.map((item) => item.localidad)) : [];
  const empresaCiclos = ciclos;

  return { ciclos, cursos, sectores, localidades, empresaCiclos };
}

async function fetchReportRows(reportKey: ReportKey): Promise<ReportRow[]> {
  if (reportKey === "alumnos") {
    const response = await fetch("/api/alumnos?perPage=500", { cache: "no-store" });
    const json: ApiResponse<{
      items: Array<{
        nombre: string;
        nia: string;
        nif: string | null;
        nuss: string | null;
        telefono: string;
        email: string;
        ciclo: string;
        cursoCiclo: number;
        curso: string;
      }>;
    }> = await response.json();
    if (!json.ok) throw new Error(json.error);
    return json.data.items.map((item) => ({
      nombre: item.nombre,
      nia: item.nia,
      nif: item.nif,
      nuss: item.nuss,
      telefono: item.telefono,
      email: item.email,
      ciclo: item.ciclo,
      cursoCiclo: formatCursoCicloValue(item.cursoCiclo),
      curso: item.curso,
      search: `${item.nombre} ${item.nia} ${item.nif ?? ""} ${item.nuss ?? ""}`,
    }));
  }

  if (reportKey === "empresas") {
    const response = await fetch("/api/empresas?all=true", { cache: "no-store" });
    const json: ApiResponse<{
      items: Array<{
        nombre: string;
        cif: string;
        direccion: string | null;
        localidad: string;
        sector: string;
        cicloFormativo: string | null;
        telefono: string | null;
        email: string | null;
        contacto: string | null;
        emailContacto: string | null;
      }>;
    }> = await response.json();
    if (!json.ok) throw new Error(json.error);
    return json.data.items.map((item) => ({
      nombre: item.nombre,
      cif: item.cif,
      direccion: item.direccion,
      localidad: item.localidad,
      sector: item.sector,
      cicloFormativo: item.cicloFormativo,
      telefono: item.telefono,
      email: item.email,
      contacto: item.contacto,
      emailContacto: item.emailContacto,
      search: `${item.nombre} ${item.cif}`,
    }));
  }

  const response = await fetch("/api/formacion?perPage=500", { cache: "no-store" });
  const json: ApiResponse<{
    items: Array<{
      curso: string;
      periodo: string | null;
      descripcion: string | null;
      tutorLaboral: string | null;
      emailTutorLaboral: string | null;
      empresa: {
        nombre: string;
        sector: string;
        localidad: string;
        cicloFormativo: string | null;
      };
      alumno: {
        nombre: string;
        nia: string;
        nif: string | null;
        nuss: string | null;
        ciclo: string;
        cursoCiclo: number;
      } | null;
    }>;
  }> = await response.json();
  if (!json.ok) throw new Error(json.error);
  return json.data.items.map((item) => ({
    empresaNombre: item.empresa.nombre,
    empresaSector: item.empresa.sector,
    empresaLocalidad: item.empresa.localidad,
    empresaCicloFormativo: item.empresa.cicloFormativo,
    alumnoNombre: item.alumno?.nombre ?? "",
    alumnoNia: item.alumno?.nia ?? "",
    alumnoNif: item.alumno?.nif ?? "",
    alumnoNuss: item.alumno?.nuss ?? "",
    alumnoCiclo: item.alumno?.ciclo ?? "",
    alumnoCursoCiclo: formatCursoCicloValue(item.alumno?.cursoCiclo),
    curso: item.curso,
    periodo: item.periodo,
    descripcion: item.descripcion,
    tutorLaboral: item.tutorLaboral,
    emailTutorLaboral: item.emailTutorLaboral,
    search: [
      item.empresa.nombre,
      item.alumno?.nombre ?? "",
      item.alumno?.nia ?? "",
      item.alumno?.nif ?? "",
      item.empresa.sector,
      item.empresa.localidad,
      item.tutorLaboral ?? "",
    ].join(" "),
  }));
}

async function downloadPdfReport(input: {
  title: string;
  mode: "complete" | "filtered";
  columns: ReportColumn[];
  rows: ReportRow[];
  enabledFilters: string[];
  filterValues: Record<string, string>;
}) {
  const doc = new jsPDF({
    orientation: input.columns.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });
  const generatedAt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
  const logoDataUrl = await loadImageDataUrl(logoInstitutoTransparente.src);
  const activeFilters = input.enabledFilters
    .map((key) => ({ key, value: (input.filterValues[key] ?? "").trim() }))
    .filter((item) => item.value !== "");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  let currentY = margin;

  if (logoDataUrl) doc.addImage(logoDataUrl, "PNG", margin, currentY, 18, 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(input.title, 35, currentY + 10.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  currentY += 23;
  doc.text(input.mode === "complete" ? "Informe completo" : "Informe por filtrado", margin, currentY);
  doc.text(`Generado: ${generatedAt}`, pageWidth - margin, currentY, { align: "right" });
  currentY += 5;
  doc.text(`Registros: ${input.rows.length}`, margin, currentY);
  doc.text(`Columnas: ${input.columns.length}`, pageWidth - margin, currentY, { align: "right" });

  if (activeFilters.length > 0 && input.mode === "filtered") {
    currentY += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Filtros aplicados", margin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    activeFilters.forEach((filter) => {
      currentY += 4.5;
      const wrapped = doc.splitTextToSize(
        `${humanizeFilterKey(filter.key)}: ${filter.value}`,
        pageWidth - margin * 2
      );
      doc.text(wrapped, margin, currentY);
      currentY += (wrapped.length - 1) * 4.5;
    });
  }

  autoTable(doc, {
    startY: currentY + 6,
    head: [input.columns.map((column) => column.label)],
    body: input.rows.map((row) => input.columns.map((column) => formatCellValue(row[column.key]))),
    margin: { top: margin, right: margin, bottom: margin, left: margin },
    styles: { font: "helvetica", fontSize: 8, cellPadding: 2, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [159, 29, 62], textColor: [255, 255, 255], fontStyle: "bold" },
    bodyStyles: { textColor: [31, 41, 55] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    theme: "grid",
  });

  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  }

  doc.save(
    `${input.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "informe"}_${new Date().toISOString().slice(0, 10)}.pdf`
  );
}

async function loadImageDataUrl(src: string) {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("No se pudo leer el logo del informe."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
