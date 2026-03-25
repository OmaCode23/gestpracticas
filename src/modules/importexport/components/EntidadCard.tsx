"use client";

import { useRef } from "react";
import type { BusyAction, CardConfig } from "@/modules/importexport/types";

export function EntidadCard({
  config,
  statusMsg,
  errorDetails,
  busyAction,
  onExport,
  onPlantilla,
  onImport,
}: {
  config: CardConfig;
  statusMsg: string;
  errorDetails: string[];
  busyAction: BusyAction;
  onExport: () => void;
  onPlantilla: () => void;
  onImport: (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isBusy = busyAction !== null;

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
          disabled={!config.enabled || isBusy}
        />

        <Accion
          icono="IM"
          iconoBg="bg-green-100"
          iconoColor="text-green-600"
          titulo={`Importar ${config.titulo.toLowerCase()} desde Excel`}
          desc="Sube tu archivo .xlsx o .xls"
          onClick={() => fileRef.current?.click()}
          disabled={!config.enabled || isBusy}
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
          disabled={!config.enabled || isBusy}
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

        {errorDetails.length > 0 && (
          <div className="mt-3 rounded-[9px] border border-red-200 bg-red-50 px-3 py-3">
            <p className="mb-2 text-[0.74rem] font-semibold text-red-700">
              Incidencias detectadas en la importacion
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 text-[0.74rem] text-red-700">
              {errorDetails.map((detail) => (
                <li key={detail}>- {detail}</li>
              ))}
            </ul>
          </div>
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
