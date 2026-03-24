"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Badge,
  Card,
  PageHeader,
  SectionLabel,
  type BadgeVariant,
} from "@/components/ui";
import { MOCK_IMPORT_LOG } from "@/shared/mockData";
import type { ApiResponse } from "@/shared/types/api";

type Entidad = "alumnos" | "empresas" | "formacion";
type SheetRow = Record<string, string>;

interface CardConfig {
  entidad: Entidad;
  titulo: string;
  icono: string;
  headerBg: string;
  descripcion: string;
  columnas: string[];
  requiredColumns: string[];
  fileName: string;
  importPath: string;
  toPayload: (row: SheetRow) => Record<string, string>;
  enabled: boolean;
  pendingMessage?: string;
}

const CARDS: CardConfig[] = [
  {
    entidad: "alumnos",
    titulo: "Alumnos",
    icono: "\u{1F393}",
    headerBg: "bg-blue-light",
    descripcion: "Importa o exporta el listado completo de alumnos.",
    columnas: ["NIA", "Nombre", "Telefono", "Correo", "Ciclo", "Curso"],
    requiredColumns: ["NIA", "Nombre", "Ciclo", "Curso"],
    fileName: "alumnos",
    importPath: "/api/alumnos",
    toPayload: (row) => ({
      nia: row.NIA,
      nombre: row.Nombre,
      telefono: normalizePhone(row.Telefono),
      email: row.Correo,
      ciclo: row.Ciclo,
      curso: row.Curso,
    }),
    enabled: false,
    pendingMessage: "Pendiente de integracion con el modulo del compañero.",
  },
  {
    entidad: "empresas",
    titulo: "Empresas",
    icono: "\u{1F3E2}",
    headerBg: "bg-[#10b981]",
    descripcion: "Gestiona el directorio de empresas colaboradoras.",
    columnas: [
      "CIF",
      "Nombre",
      "Dirección",
      "Localidad",
      "Sector",
      "Ciclo Formativo",
      "Teléfono",
      "Correo Empresa",
      "Contacto",
      "Correo Contacto",
    ],
    requiredColumns: ["CIF", "Nombre", "Localidad", "Sector"],
    fileName: "empresas",
    importPath: "/api/empresas",
    toPayload: (row) => ({
      cif: row.CIF,
      nombre: row.Nombre,
      direccion: row["Dirección"],
      localidad: row.Localidad,
      sector: row.Sector,
      cicloFormativo: row["Ciclo Formativo"],
      telefono: normalizePhone(row["Teléfono"]),
      email: row["Correo Empresa"],
      contacto: row.Contacto,
      emailContacto: row["Correo Contacto"],
    }),
    enabled: true,
  },
  {
    entidad: "formacion",
    titulo: "Formacion Empresa",
    icono: "\u{1F4CB}",
    headerBg: "bg-purple-600",
    descripcion: "Importa o exporta las formaciones en empresa por curso.",
    columnas: ["Empresa", "Alumno", "Periodo", "Descripcion", "Contacto", "Curso"],
    requiredColumns: ["Empresa", "Alumno", "Curso"],
    fileName: "formacion_empresa",
    importPath: "/api/formacion",
    toPayload: (row) => ({
      empresa: row.Empresa,
      alumno: row.Alumno,
      periodo: row.Periodo,
      descripcion: row.Descripcion,
      contacto: row.Contacto,
      curso: row.Curso,
    }),
    enabled: false,
    pendingMessage: "Pendiente de integracion con el modulo del compañero.",
  },
];

const ENTIDAD_BADGE: Record<string, BadgeVariant> = {
  Alumnos: "blue",
  Empresas: "green",
  "Form. Empresa": "purple",
};

function normalizePhone(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function createEmptyRow(columns: string[]) {
  return columns.reduce<SheetRow>((acc, column) => {
    acc[column] = "";
    return acc;
  }, {});
}

function formatDateStamp(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function buildSheetRows(rawRows: Record<string, unknown>[], config: CardConfig) {
  const columnMap = new Map(config.columnas.map((column) => [normalizeHeader(column), column]));

  return rawRows
    .map((rawRow) => {
      const normalized = createEmptyRow(config.columnas);

      for (const [key, value] of Object.entries(rawRow)) {
        const targetColumn = columnMap.get(normalizeHeader(key));

        if (targetColumn) {
          normalized[targetColumn] = String(value ?? "").trim();
        }
      }

      return normalized;
    })
    .filter((row) =>
      config.columnas.some((column) => {
        return row[column].trim() !== "";
      })
    );
}

function findDuplicateValues(rows: SheetRow[], column: string) {
  const seen = new Map<string, number>();
  const duplicates: Array<{ value: string; firstRow: number; duplicateRow: number }> = [];

  rows.forEach((row, index) => {
    const value = row[column]?.trim();

    if (!value) return;

    const normalizedValue = value.toUpperCase();
    const excelRow = index + 2;

    if (seen.has(normalizedValue)) {
      duplicates.push({
        value,
        firstRow: seen.get(normalizedValue)!,
        duplicateRow: excelRow,
      });
      return;
    }

    seen.set(normalizedValue, excelRow);
  });

  return duplicates;
}

function downloadWorkbook(rows: SheetRow[], columns: string[], fileName: string) {
  const exportRows = rows.length > 0 ? rows : [createEmptyRow(columns)];
  const worksheet = XLSX.utils.json_to_sheet(exportRows, { header: columns });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, fileName);
}

export default function ImportExportPage() {
  const [status, setStatus] = useState<Record<Entidad, string>>({
    alumnos: "",
    empresas: "",
    formacion: "",
  });

  const handleExport = async (config: CardConfig) => {
    if (!config.enabled) {
      setStatus((current) => ({
        ...current,
        [config.entidad]: config.pendingMessage ?? "Pendiente de integracion.",
      }));
      return;
    }

    setStatus((current) => ({ ...current, [config.entidad]: "Exportando datos..." }));

    try {
      const res = await fetch(`/api/exportar/${config.entidad}`, {
        cache: "no-store",
      });
      const json: ApiResponse<SheetRow[]> = await res.json();

      if (!json.ok) {
        throw new Error(json.error);
      }

      const rows = json.data.map((row) => createEmptyRow(config.columnas));
      json.data.forEach((row, index) => {
        for (const column of config.columnas) {
          rows[index][column] = String(row[column] ?? "");
        }
      });

      downloadWorkbook(
        rows,
        config.columnas,
        `${config.fileName}_${formatDateStamp()}.xlsx`
      );

      setStatus((current) => ({
        ...current,
        [config.entidad]: `Exportacion completada (${json.data.length} registros).`,
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [config.entidad]: `Error: ${getErrorMessage(error)}`,
      }));
    }
  };

  const handlePlantilla = (config: CardConfig) => {
    if (!config.enabled) {
      setStatus((current) => ({
        ...current,
        [config.entidad]: config.pendingMessage ?? "Pendiente de integracion.",
      }));
      return;
    }

    downloadWorkbook([], config.columnas, `plantilla_${config.fileName}.xlsx`);
    setStatus((current) => ({
      ...current,
      [config.entidad]: "Plantilla descargada correctamente.",
    }));
  };

  const handleImport = async (config: CardConfig, file: File) => {
    if (!config.enabled) {
      setStatus((current) => ({
        ...current,
        [config.entidad]: config.pendingMessage ?? "Pendiente de integracion.",
      }));
      return;
    }

    setStatus((current) => ({
      ...current,
      [config.entidad]: `Leyendo ${file.name}...`,
    }));

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("El archivo no contiene ninguna hoja.");
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });
      const rows = buildSheetRows(rawRows, config);

      if (rows.length === 0) {
        throw new Error("El archivo no contiene filas con datos.");
      }

      const missingColumns = config.requiredColumns.filter((column) =>
        rows.some((row) => row[column].trim() === "")
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Faltan datos obligatorios en las columnas: ${missingColumns.join(", ")}.`
        );
      }

      if (config.entidad === "empresas") {
        const duplicateCifs = findDuplicateValues(rows, "CIF");

        if (duplicateCifs.length > 0) {
          const firstDuplicate = duplicateCifs[0];
          throw new Error(
            `CIF duplicado en el Excel: "${firstDuplicate.value}" aparece en las filas ${firstDuplicate.firstRow} y ${firstDuplicate.duplicateRow}.`
          );
        }
      }

      for (const [index, row] of rows.entries()) {
        const payload = config.toPayload(row);
        const res = await fetch(config.importPath, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const json: ApiResponse<unknown> = await res.json();

        if (!json.ok) {
          throw new Error(
            `Fallo al importar la fila ${index + 2} de ${rows.length + 1}: ${json.error}`
          );
        }
      }

      setStatus((current) => ({
        ...current,
        [config.entidad]: `Importacion completada (${rows.length} registros).`,
      }));
    } catch (error) {
      setStatus((current) => ({
        ...current,
        [config.entidad]: `Error: ${getErrorMessage(error)}`,
      }));
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Importar · Exportar"
        title="Gestion de Datos"
        subtitle="Importacion masiva mediante plantillas Excel y exportacion de los datos actuales."
      />

      <Alert variant="info">
        Las plantillas incluyen las columnas necesarias. Respeta el formato antes de
        importar.
      </Alert>

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {CARDS.map((config) => (
          <EntidadCard
            key={config.entidad}
            config={config}
            statusMsg={status[config.entidad]}
            onExport={() => handleExport(config)}
            onPlantilla={() => handlePlantilla(config)}
            onImport={(file) => handleImport(config, file)}
          />
        ))}
      </div>

      <SectionLabel>Actividad reciente de importaciones</SectionLabel>
      <Card>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Accion</th>
                <th>Registros</th>
                <th>Estado</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_IMPORT_LOG.map((row, index) => (
                <tr key={index}>
                  <td className="text-text-mid">{row.fecha}</td>
                  <td>
                    <Badge variant={ENTIDAD_BADGE[row.tipo] ?? "gray"}>{row.tipo}</Badge>
                  </td>
                  <td>{row.accion}</td>
                  <td>{row.registros}</td>
                  <td>
                    <Badge variant="green">{row.estado}</Badge>
                  </td>
                  <td>{row.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ha ocurrido un error inesperado.";
}

function EntidadCard({
  config,
  statusMsg,
  onExport,
  onPlantilla,
  onImport,
}: {
  config: CardConfig;
  statusMsg: string;
  onExport: () => void;
  onPlantilla: () => void;
  onImport: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="overflow-hidden rounded-[13px] border-[1.5px] border-border bg-white shadow-card">
      <div
        className={`flex items-center gap-2 px-5 py-4 text-[0.9rem] font-bold text-white ${config.headerBg}`}
      >
        {config.icono} {config.titulo}
      </div>

      <div className="p-5">
        <p className="mb-3.5 text-[0.78rem] text-text-light">{config.descripcion}</p>

        {!config.enabled && (
          <p className="mb-3.5 rounded-[9px] border border-amber-200 bg-amber-50 px-3 py-2 text-[0.74rem] text-amber-700">
            {config.pendingMessage}
          </p>
        )}

        <Accion
          icono="PL"
          iconoBg="bg-blue-100"
          iconoColor="text-blue-600"
          titulo="Descargar plantilla"
          desc={`Columnas: ${config.columnas.slice(0, 3).join(", ")}...`}
          onClick={onPlantilla}
          disabled={!config.enabled}
        />

        <Accion
          icono="IM"
          iconoBg="bg-green-100"
          iconoColor="text-green-600"
          titulo={`Importar ${config.titulo.toLowerCase()} desde Excel`}
          desc="Sube tu archivo .xlsx o .xls"
          onClick={() => fileRef.current?.click()}
          disabled={!config.enabled}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onImport(file);
            event.target.value = "";
          }}
        />

        <Accion
          icono="EX"
          iconoBg="bg-amber-100"
          iconoColor="text-amber-600"
          titulo={`Exportar ${config.titulo.toLowerCase()} actuales`}
          desc="Descarga en formato Excel"
          onClick={onExport}
          disabled={!config.enabled}
        />

        {statusMsg && (
          <p
            className={`mt-2 text-[0.75rem] font-medium ${
              statusMsg.startsWith("Error")
                ? "text-red-500"
                : statusMsg.includes("completada") ||
                    statusMsg.includes("descargada") ||
                    statusMsg.includes("completado")
                  ? "text-green-600"
                  : "text-text-mid"
            }`}
          >
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}

function Accion({
  icono,
  iconoBg,
  iconoColor,
  titulo,
  desc,
  onClick,
  disabled = false,
}: {
  icono: string;
  iconoBg: string;
  iconoColor: string;
  titulo: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`mb-2.5 flex w-full items-center gap-3 rounded-[9px] border bg-surface p-3 text-left transition-all last:mb-0 ${
        disabled
          ? "cursor-not-allowed border-border/70 opacity-55"
          : "cursor-pointer border-border hover:border-blue-light hover:bg-surface2"
      }`}
    >
      <div
        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-[0.7rem] font-semibold ${iconoBg} ${iconoColor}`}
      >
        {icono}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[0.82rem] font-semibold text-navy">{titulo}</h4>
        <p className="text-[0.74rem] text-text-light">{desc}</p>
      </div>
      <span className="shrink-0 text-lg text-text-light">{">"}</span>
    </button>
  );
}
