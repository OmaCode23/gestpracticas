"use client";

import { useMemo, useState } from "react";
import Pagination from "@/components/ui/Pagination";
import { Badge, Card, SectionLabel } from "@/components/ui";
import {
  ENTIDAD_BADGE,
  ESTADO_BADGE,
  LOG_FILTER_OPTIONS,
} from "@/modules/importexport/config";
import type { ImportExportLogRow, LogFilters } from "@/modules/importexport/types";
import { formatLogDate } from "@/modules/importexport/utils";

/**
 * Tabla de actividad reciente con filtros, paginacion y acceso al detalle de cada log.
 */
export function ImportExportActivityTable({
  logs,
  logsError,
  page,
  total,
  perPage,
  filters,
  onPageChange,
  onFiltersChange,
}: {
  logs: ImportExportLogRow[];
  logsError: string;
  page: number;
  total: number;
  perPage: number;
  filters: LogFilters;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: LogFilters) => void;
}) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);

  // Se recalcula solo cuando cambian el listado cargado o el log seleccionado.
  const selectedLog = useMemo(
    () => logs.find((log) => log.id === selectedLogId) ?? null,
    [logs, selectedLogId]
  );

  return (
    <>
      <SectionLabel>Actividad reciente de importaciones</SectionLabel>
      <Card>
        <div className="border-b border-border px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FiltroSelect
              label="Entidad"
              value={filters.entidad}
              options={LOG_FILTER_OPTIONS.entidad}
              onChange={(value) => onFiltersChange({ ...filters, entidad: value })}
            />
            <FiltroSelect
              label="Accion"
              value={filters.accion}
              options={LOG_FILTER_OPTIONS.accion}
              onChange={(value) => onFiltersChange({ ...filters, accion: value })}
            />
            <FiltroSelect
              label="Estado"
              value={filters.estado}
              options={LOG_FILTER_OPTIONS.estado}
              onChange={(value) => onFiltersChange({ ...filters, estado: value })}
            />
          </div>
        </div>

        {logsError ? (
          <p className="px-5 py-4 text-sm text-red-500">
            Error al cargar el historial: {logsError}
          </p>
        ) : (
          <>
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
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-text-light">
                        No hay operaciones para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    logs.map((row) => (
                      <tr key={row.id}>
                        <td className="text-text-mid">{formatLogDate(row.createdAt)}</td>
                        <td>
                          <Badge variant={ENTIDAD_BADGE[row.entidad] ?? "gray"}>
                            {row.entidad}
                          </Badge>
                        </td>
                        <td>{row.accion}</td>
                        <td>{row.registros} registros</td>
                        <td>
                          <Badge variant={ESTADO_BADGE[row.estado] ?? "gray"}>
                            {row.estado}
                          </Badge>
                        </td>
                        <td>{row.usuario}</td>
                        <td>
                          {row.detalle ? (
                            <button
                              type="button"
                              onClick={() => setSelectedLogId(row.id)}
                              className="text-[0.75rem] font-semibold text-blue hover:underline"
                            >
                              Ver detalle
                            </button>
                          ) : (
                            <span className="text-[0.75rem] text-text-light">Sin detalle</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <Pagination
                page={page}
                total={total}
                perPage={perPage}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </Card>

      {selectedLog && (
        <DetalleLogModal log={selectedLog} onClose={() => setSelectedLogId(null)} />
      )}
    </>
  );
}

/**
 * Select reutilizable para los filtros del historial.
 */
function FiltroSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border-[1.5px] border-border bg-white px-3 py-2 text-sm text-text-mid outline-none transition-colors focus:border-blue-light"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Modal ligero para consultar el detalle completo de una operacion del historial.
 */
function DetalleLogModal({
  log,
  onClose,
}: {
  log: ImportExportLogRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-[16px] border border-border bg-white shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-[1rem] font-semibold text-navy">Detalle de la operacion</h3>
            <p className="mt-1 text-[0.78rem] text-text-mid">
              {log.entidad} / {log.accion} / {formatLogDate(log.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-[0.75rem] font-semibold text-text-mid transition-colors hover:bg-surface"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-b border-border bg-surface px-5 py-4 text-[0.78rem] text-text-mid md:grid-cols-4">
          <div>
            <p className="font-semibold text-navy">Entidad</p>
            <p>{log.entidad}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Accion</p>
            <p>{log.accion}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Estado</p>
            <p>{log.estado}</p>
          </div>
          <div>
            <p className="font-semibold text-navy">Usuario</p>
            <p>{log.usuario}</p>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          <pre className="whitespace-pre-wrap break-words rounded-[12px] border border-border bg-surface px-4 py-3 font-mono text-[0.78rem] text-text-mid">
            {log.detalle}
          </pre>
        </div>
      </div>
    </div>
  );
}
