"use client";

/**
 * app/importexport/page.tsx
 * TODO: Conectar exportación con /api/exportar/:tipo
 *       Conectar importación con /api/:tipo (POST masivo)
 */

import { useRef, useState } from "react";
import {
  PageHeader, SectionLabel, Alert, Card, Badge, type BadgeVariant,
} from "@/components/ui";
import { MOCK_IMPORT_LOG } from "@/shared/mockData";

// ─── Tipos de entidad ─────────────────────────────────────────
type Entidad = "alumnos" | "empresas" | "formacion";

interface CardConfig {
  entidad:   Entidad;
  titulo:    string;
  icono:     string;
  headerBg:  string;
  descripcion: string;
  columnas:  string[];
}

const CARDS: CardConfig[] = [
  {
    entidad:     "alumnos",
    titulo:      "Alumnos",
    icono:       "👩‍🎓",
    headerBg:    "bg-blue-light",
    descripcion: "Importa o exporta el listado completo de alumnos.",
    columnas:    ["NIA", "Nombre", "Teléfono", "Correo", "Ciclo", "Curso"],
  },
  {
    entidad:     "empresas",
    titulo:      "Empresas",
    icono:       "🏢",
    headerBg:    "bg-[#10b981]",
    descripcion: "Gestiona el directorio de empresas colaboradoras.",
    columnas:    ["CIF", "Nombre", "Dirección", "Localidad", "Sector", "Ciclo", "Teléfono", "Correo", "Contacto"],
  },
  {
    entidad:     "formacion",
    titulo:      "Formación Empresa",
    icono:       "📋",
    headerBg:    "bg-purple-600",
    descripcion: "Importa o exporta las formaciones en empresa por curso.",
    columnas:    ["Empresa", "Alumno", "Periodo", "Descripción", "Contacto", "Curso"],
  },
];

// Badge por tipo de entidad en el log
const ENTIDAD_BADGE: Record<string, BadgeVariant> = {
  "Alumnos":       "blue",
  "Empresas":      "green",
  "Form. Empresa": "purple",
};

export default function ImportExportPage() {
  // Mensaje de estado por entidad (cargando / éxito / error)
  const [status, setStatus] = useState<Record<Entidad, string>>({
    alumnos: "", empresas: "", formacion: "",
  });

  // ─── Exportar ─────────────────────────────────────────────
  const handleExport = async (entidad: Entidad) => {
    setStatus(s => ({ ...s, [entidad]: "Exportando..." }));
    try {
      // TODO: Sustituir por fetch real a /api/exportar/:entidad
      // const res  = await fetch(`/api/exportar/${entidad}`);
      // const json = await res.json();
      // Generar Excel con SheetJS usando json.data

      // Por ahora simulamos un retardo y éxito
      await new Promise(r => setTimeout(r, 800));
      setStatus(s => ({ ...s, [entidad]: "✓ Exportado correctamente" }));
    } catch (err: any) {
      setStatus(s => ({ ...s, [entidad]: `Error: ${err.message}` }));
    }
  };

  // ─── Descargar plantilla vacía ────────────────────────────
  const handlePlantilla = async (config: CardConfig) => {
    // TODO: Generar Excel vacío con SheetJS usando config.columnas
    // import * as XLSX from "xlsx";
    // const ws = XLSX.utils.aoa_to_sheet([config.columnas]);
    // const wb = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    // XLSX.writeFile(wb, `plantilla_${config.entidad}.xlsx`);
    alert(`Plantilla de ${config.titulo}: ${config.columnas.join(", ")}`);
  };

  // ─── Importar desde Excel ─────────────────────────────────
  const handleImport = async (config: CardConfig, file: File) => {
    setStatus(s => ({ ...s, [config.entidad]: `Leyendo ${file.name}...` }));
    try {
      // TODO: Leer Excel con SheetJS y enviar filas a la API
      // import * as XLSX from "xlsx";
      // const data  = await file.arrayBuffer();
      // const wb    = XLSX.read(data);
      // const rows  = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      // for (const row of rows) { await fetch(`/api/${config.entidad}`, { method: "POST", body: JSON.stringify(row) }); }
      await new Promise(r => setTimeout(r, 1000));
      setStatus(s => ({ ...s, [config.entidad]: "✓ Importación completada" }));
    } catch (err: any) {
      setStatus(s => ({ ...s, [config.entidad]: `Error: ${err.message}` }));
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio" breadcrumbHighlight="/ Importar · Exportar"
        title="Gestión de Datos"
        subtitle="Importación masiva mediante plantillas Excel y exportación de los datos actuales."
      />

      <Alert variant="info">
        ℹ️ Las plantillas incluyen las columnas necesarias. Respeta el formato antes de importar.
      </Alert>

      {/* ── Cards de entidad ── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {CARDS.map(config => (
          <EntidadCard
            key={config.entidad}
            config={config}
            statusMsg={status[config.entidad]}
            onExport={() => handleExport(config.entidad)}
            onPlantilla={() => handlePlantilla(config)}
            onImport={file => handleImport(config, file)}
          />
        ))}
      </div>

      {/* ── Log de actividad ── */}
      <SectionLabel>Actividad reciente de importaciones</SectionLabel>
      <Card>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>Tipo</th><th>Acción</th>
                <th>Registros</th><th>Estado</th><th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_IMPORT_LOG.map((row, i) => (
                <tr key={i}>
                  <td className="text-text-mid">{row.fecha}</td>
                  <td><Badge variant={ENTIDAD_BADGE[row.tipo] ?? "gray"}>{row.tipo}</Badge></td>
                  <td>{row.accion}</td>
                  <td>{row.registros}</td>
                  <td><Badge variant="green">✓ {row.estado}</Badge></td>
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

// ─── Subcomponente: card individual ──────────────────────────
function EntidadCard({ config, statusMsg, onExport, onPlantilla, onImport }: {
  config:     CardConfig;
  statusMsg:  string;
  onExport:   () => void;
  onPlantilla:() => void;
  onImport:   (file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-[13px] border-[1.5px] border-border overflow-hidden shadow-card">
      {/* Header de color */}
      <div className={`px-5 py-4 font-bold text-[0.9rem] text-white flex items-center gap-2 ${config.headerBg}`}>
        {config.icono} {config.titulo}
      </div>

      <div className="p-5">
        <p className="text-[0.78rem] text-text-light mb-3.5">{config.descripcion}</p>

        {/* Descargar plantilla */}
        <Accion
          icono="⬇️" iconoBg="bg-blue-100" iconoColor="text-blue-600"
          titulo="Descargar plantilla"
          desc={`Columnas: ${config.columnas.slice(0, 3).join(", ")}...`}
          onClick={onPlantilla}
        />

        {/* Importar */}
        <Accion
          icono="📤" iconoBg="bg-green-100" iconoColor="text-green-600"
          titulo={`Importar ${config.titulo.toLowerCase()} desde Excel`}
          desc="Sube tu archivo .xlsx"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = "";
          }}
        />

        {/* Exportar */}
        <Accion
          icono="📥" iconoBg="bg-amber-100" iconoColor="text-amber-600"
          titulo={`Exportar ${config.titulo.toLowerCase()} actuales`}
          desc="Descarga en formato Excel"
          onClick={onExport}
        />

        {/* Estado */}
        {statusMsg && (
          <p className={`text-[0.75rem] mt-2 font-medium ${
            statusMsg.startsWith("✓") ? "text-green-600"
            : statusMsg.startsWith("Error") ? "text-red-500"
            : "text-text-mid"
          }`}>
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Fila de acción clickable ─────────────────────────────────
function Accion({ icono, iconoBg, iconoColor, titulo, desc, onClick }: {
  icono: string; iconoBg: string; iconoColor: string;
  titulo: string; desc: string; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-[9px] bg-surface border border-border mb-2.5 cursor-pointer transition-all hover:bg-surface2 hover:border-blue-light last:mb-0"
    >
      <div className={`w-[34px] h-[34px] rounded-lg flex items-center justify-center shrink-0 text-base ${iconoBg} ${iconoColor}`}>
        {icono}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[0.82rem] font-semibold text-navy">{titulo}</h4>
        <p className="text-[0.74rem] text-text-light">{desc}</p>
      </div>
      <span className="text-text-light text-lg shrink-0">›</span>
    </div>
  );
}
