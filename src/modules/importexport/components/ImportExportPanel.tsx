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
  mapAlumnoRows,
  mapEmpresaRows,
  mapFormacionRows,
} from "@/modules/importexport/utils";
import type { ApiResponse } from "@/shared/types/api";

const ENTITY_LOG_LABEL: Record<Entidad, string> = {
  alumnos: "Alumnos",
  empresas: "Empresas",
  formacion: "Form. Empresa",
};

/**
 * Componente orquestador del modulo:
 * maneja el estado de cada entidad, ejecuta importaciones/exportaciones
 * y mantiene sincronizado el historial de actividad.
 */
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

  /**
   * Consulta el historial actual aplicando paginacion y filtros.
   */
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

  // Recarga el historial cuando cambia cualquiera de los filtros o la pagina actual.
  useEffect(() => {
    void loadLogs();
  }, [logFilters.entidad, logFilters.accion, logFilters.estado, logsPage]);

  // Al cambiar filtros volvemos a la primera pagina para evitar huecos de paginacion.
  useEffect(() => {
    setLogsPage(1);
  }, [logFilters.entidad, logFilters.accion, logFilters.estado]);

  /**
   * Helpers para actualizar solo la parte del estado asociada a una entidad concreta.
   */
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

  const registerImportFailureLog = async (entidad: Entidad, details: string[]) => {
    try {
      await fetch("/api/importexport/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entidad: ENTITY_LOG_LABEL[entidad],
          accion: "Importacion",
          registros: 0,
          estado: "Fallido",
          detalle: details.join("\n"),
        }),
      });
    } catch (error) {
      console.error("[ImportExportPanel] No se pudo registrar el log local", error);
    }
  };

  /**
   * Descarga los datos actuales de una entidad como Excel.
   */
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

        // La hoja final siempre sigue el orden exacto definido en la configuracion.
        for (const column of config.columnas) {
          normalizedRow[column] = String(row[column] ?? "");
        }

        return normalizedRow;
      });

      await downloadWorkbook(
        rows,
        config.columnas,
        `${config.fileName}_${formatDateStamp()}.xlsx`,
        {
          title: `Exportacion de ${config.titulo}`,
          subtitle: `${json.data.length} registro(s) exportado(s)`,
          sheetName: "Exportacion",
        }
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

  /**
   * Descarga una plantilla vacia para que el usuario rellene datos con el formato correcto.
   */
  const handlePlantilla = async (config: CardConfig) => {
    if (!config.enabled) {
      setEntityStatus(
        config.entidad,
        config.pendingMessage ?? "Pendiente de integracion."
      );
      return;
    }

    clearEntityFeedback(config.entidad);
    setEntityBusy(config.entidad, "plantilla");
    try {
      await downloadWorkbook([], config.columnas, `plantilla_${config.fileName}.xlsx`, {
        title: `Plantilla de ${config.titulo}`,
        subtitle: "Rellena las columnas y conserva la cabecera para importar",
        sheetName: "Plantilla",
        template: true,
      });
      setEntityStatus(config.entidad, "Plantilla descargada correctamente.");
    } catch (error) {
      setEntityStatus(config.entidad, `Error: ${getErrorMessage(error)}`);
    } finally {
      setEntityBusy(config.entidad, null);
    }
  };

  /**
   * Lee el Excel, valida su contenido y lo envia a la API de importacion correspondiente.
   */
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

      // Primero se inspecciona la cabecera real para validar columnas obligatorias.
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
        await registerImportFailureLog(config.entidad, excelErrors);
        await loadLogs();
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
          rows:
            config.entidad === "empresas"
              ? mapEmpresaRows(rows)
              : config.entidad === "alumnos"
                ? mapAlumnoRows(rows)
                : config.entidad === "formacion"
                  ? mapFormacionRows(rows)
                  : rows,
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
