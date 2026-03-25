"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Alert, PageHeader } from "@/components/ui";
import { CARDS } from "@/modules/importexport/config";
import { EntidadCard } from "@/modules/importexport/components/EntidadCard";
import { ImportExportActivityTable } from "@/modules/importexport/components/ImportExportActivityTable";
import type {
  BusyAction,
  CardConfig,
  Entidad,
  ImportExportLogRow,
  LogFilters,
  PaginatedImportExportLogs,
  ImportResponse,
} from "@/modules/importexport/types";
import {
  buildSheetRows,
  collectExcelValidationErrors,
  downloadWorkbook,
  formatDateStamp,
  getErrorDetails,
  getErrorMessage,
  mapEmpresaRows,
} from "@/modules/importexport/utils";
import type { ApiResponse } from "@/shared/types/api";

export default function ImportExportPanel() {
  const [status, setStatus] = useState<Record<Entidad, string>>({
    alumnos: "",
    empresas: "",
    formacion: "",
  });
  const [busyByEntity, setBusyByEntity] = useState<Record<Entidad, BusyAction>>({
    alumnos: null,
    empresas: null,
    formacion: null,
  });
  const [errorDetails, setErrorDetails] = useState<Record<Entidad, string[]>>({
    alumnos: [],
    empresas: [],
    formacion: [],
  });
  const [logs, setLogs] = useState<ImportExportLogRow[]>([]);
  const [logsError, setLogsError] = useState("");
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPerPage, setLogsPerPage] = useState(5);
  const [logFilters, setLogFilters] = useState<LogFilters>({
    entidad: "",
    accion: "",
    estado: "",
  });

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();

      if (logFilters.entidad) params.set("entidad", logFilters.entidad);
      if (logFilters.accion) params.set("accion", logFilters.accion);
      if (logFilters.estado) params.set("estado", logFilters.estado);
      params.set("page", String(logsPage));
      params.set("limit", "5");

      const query = params.toString();
      const res = await fetch(`/api/importexport/logs${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });
      const json: ApiResponse<PaginatedImportExportLogs> = await res.json();

      if (!json.ok) {
        throw new Error(json.error);
      }

      setLogs(json.data.items);
      setLogsTotal(json.data.total);
      setLogsPerPage(json.data.perPage);
      setLogsError("");
    } catch (error) {
      setLogsError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    void loadLogs();
  }, [logFilters.entidad, logFilters.accion, logFilters.estado, logsPage]);

  useEffect(() => {
    setLogsPage(1);
  }, [logFilters.entidad, logFilters.accion, logFilters.estado]);

  const setEntityStatus = (entidad: Entidad, message: string) => {
    setStatus((current) => ({ ...current, [entidad]: message }));
  };

  const setEntityBusy = (entidad: Entidad, action: BusyAction) => {
    setBusyByEntity((current) => ({ ...current, [entidad]: action }));
  };

  const setEntityErrors = (entidad: Entidad, details: string[]) => {
    setErrorDetails((current) => ({ ...current, [entidad]: details }));
  };

  const clearEntityFeedback = (entidad: Entidad) => {
    setEntityStatus(entidad, "");
    setEntityErrors(entidad, []);
  };

  const handleExport = async (config: CardConfig) => {
    if (!config.enabled) {
      setEntityStatus(
        config.entidad,
        config.pendingMessage ?? "Pendiente de integracion."
      );
      return;
    }

    setEntityBusy(config.entidad, "exportacion");
    setEntityErrors(config.entidad, []);
    setEntityStatus(config.entidad, "Exportando datos...");

    try {
      const res = await fetch(`/api/exportar/${config.entidad}`, {
        cache: "no-store",
      });
      const json: ApiResponse<Record<string, string>[]> = await res.json();

      if (!json.ok) {
        throw new Error(json.error);
      }

      if (json.data.length === 0) {
        setEntityStatus(
          config.entidad,
          "No hay registros disponibles para exportar."
        );
        return;
      }

      const rows = json.data.map((row) => {
        const normalizedRow: Record<string, string> = {};

        for (const column of config.columnas) {
          normalizedRow[column] = String(row[column] ?? "");
        }

        return normalizedRow;
      });

      downloadWorkbook(
        rows,
        config.columnas,
        `${config.fileName}_${formatDateStamp()}.xlsx`
      );

      setEntityStatus(
        config.entidad,
        `Exportacion completada (${json.data.length} registros).`
      );
      await loadLogs();
    } catch (error) {
      setEntityStatus(config.entidad, `Error: ${getErrorMessage(error)}`);
    } finally {
      setEntityBusy(config.entidad, null);
    }
  };

  const handlePlantilla = (config: CardConfig) => {
    if (!config.enabled) {
      setEntityStatus(
        config.entidad,
        config.pendingMessage ?? "Pendiente de integracion."
      );
      return;
    }

    clearEntityFeedback(config.entidad);
    setEntityBusy(config.entidad, "plantilla");
    downloadWorkbook([], config.columnas, `plantilla_${config.fileName}.xlsx`);
    setEntityStatus(config.entidad, "Plantilla descargada correctamente.");
    setEntityBusy(config.entidad, null);
  };

  const handleImport = async (config: CardConfig, file: File) => {
    if (!config.enabled) {
      setEntityStatus(
        config.entidad,
        config.pendingMessage ?? "Pendiente de integracion."
      );
      return;
    }

    setEntityBusy(config.entidad, "importacion");
    setEntityErrors(config.entidad, []);
    setEntityStatus(config.entidad, `Leyendo ${file.name}...`);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new Error("El archivo no contiene ninguna hoja.");
      }

      const worksheet = workbook.Sheets[sheetName];
      const previewRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
        header: 1,
        defval: "",
        blankrows: false,
      });
      const headerRow = (previewRows[0] ?? []).map((cell) => String(cell ?? "").trim());

      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: "",
      });
      const rows = buildSheetRows(rawRows, config);
      const excelErrors = collectExcelValidationErrors({
        config,
        headerRow,
        rows,
      });

      if (excelErrors.length > 0) {
        setEntityErrors(config.entidad, excelErrors);
        throw new Error(
          `Se han detectado ${excelErrors.length} incidencia(s) en el Excel.`
        );
      }

      const res = await fetch(config.importPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rows: config.entidad === "empresas" ? mapEmpresaRows(rows) : rows,
        }),
      });
      const json: ApiResponse<ImportResponse, string[]> = await res.json();

      if (!json.ok) {
        setEntityErrors(config.entidad, getErrorDetails(json));
        await loadLogs();
        throw new Error(json.error);
      }

      setEntityErrors(config.entidad, []);
      setEntityStatus(config.entidad, json.data.message);
      await loadLogs();
    } catch (error) {
      setEntityStatus(config.entidad, `Error: ${getErrorMessage(error)}`);
    } finally {
      setEntityBusy(config.entidad, null);
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Importar / Exportar"
        title="Gestion de Datos"
        subtitle="Importacion masiva mediante plantillas Excel y exportacion de los datos actuales."
      />

      <Alert variant="info">
        Las plantillas incluyen las columnas necesarias. Respeta el formato antes de
        importar para evitar errores de validacion.
      </Alert>

      <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {CARDS.map((config) => (
          <EntidadCard
            key={config.entidad}
            config={config}
            statusMsg={status[config.entidad]}
            errorDetails={errorDetails[config.entidad]}
            busyAction={busyByEntity[config.entidad]}
            onExport={() => handleExport(config)}
            onPlantilla={() => handlePlantilla(config)}
            onImport={(file) => handleImport(config, file)}
          />
        ))}
      </div>

      <ImportExportActivityTable
        logs={logs}
        logsError={logsError}
        page={logsPage}
        total={logsTotal}
        perPage={logsPerPage}
        filters={logFilters}
        onPageChange={setLogsPage}
        onFiltersChange={setLogFilters}
      />
    </div>
  );
}
