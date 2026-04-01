"use client";

import {
  Card,
  TableFilters,
  Button,
  TdActions,
  Badge,
  SectionLabel,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import { CICLO_BADGE } from "@/shared/catalogs/academico";
import type { Alumno } from "@/modules/alumnos/types";

interface AlumnosTableProps {
  alumnos: Alumno[];
  ciclos: { id: number; nombre: string; codigo: string | null }[];
  cursos: string[];
  total: number;
  perPage: number;
  ciclo: string;
  curso: string;
  search: string;
  page: number;
  onChangeCiclo: (v: string) => void;
  onChangeCurso: (v: string) => void;
  onChangeSearch: (v: string) => void;
  onPageChange: (p: number) => void;
  onVer: (alumno: Alumno) => void;
  onEditar: (alumno: Alumno) => void;
  onEliminar: (id: number) => void;
  onDownloadAllCv: () => void;
  onDeleteAllCv: () => void;
  bulkCvBusy: "download" | "delete" | null;
}

export default function AlumnosTable({
  alumnos,
  ciclos,
  cursos,
  total,
  perPage,
  ciclo,
  curso,
  search,
  page,
  onChangeCiclo,
  onChangeCurso,
  onChangeSearch,
  onPageChange,
  onVer,
  onEditar,
  onEliminar,
  onDownloadAllCv,
  onDeleteAllCv,
  bulkCvBusy,
}: AlumnosTableProps) {
  const formatCursoCiclo = (value: number) => `${value}.\u00BA`;

  return (
    <>
      <SectionLabel>Listado de alumnos</SectionLabel>

      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">
            Filtrar por:
          </span>

          <FilterSelect
            value={ciclo}
            onChange={onChangeCiclo}
          >
            <option value="">Todos los ciclos</option>
            {ciclos.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.codigo ?? c.nombre}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={curso}
            onChange={onChangeCurso}
          >
            <option value="">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onChangeSearch}
            placeholder="Buscar alumno o NIA..."
          />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onDownloadAllCv}
              disabled={bulkCvBusy !== null}
            >
              {bulkCvBusy === "download" ? "Descargando CVs..." : "Descargar todos los CVs"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDeleteAllCv}
              disabled={bulkCvBusy !== null}
            >
              {bulkCvBusy === "delete" ? "Eliminando CVs..." : "Eliminar todos los CVs"}
            </Button>
          </div>
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIA</th>
                <th>Ciclo</th>
                <th>
                  Curso
                  <br />
                  Ciclo
                </th>
                <th>
                  Curso
                  <br />
                  Academico
                </th>
                <th>Telefono</th>
                <th>Correo</th>
                <th>CV</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {alumnos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-text-light">
                    No se encontraron alumnos.
                  </td>
                </tr>
              ) : (
                alumnos.map((a) => {
                  const cicloBadgeLabel =
                    a.cicloFormativoCodigo ?? a.cicloFormativoNombre ?? "-";

                  return (
                    <tr key={a.id}>
                      <td>
                        <strong className="block max-w-[220px] truncate" title={a.nombre}>
                          {a.nombre}
                        </strong>
                      </td>

                      <td className="text-text-mid">{a.nia}</td>

                      <td>
                        <Badge
                          variant={
                            a.cicloFormativoCodigo
                              ? (CICLO_BADGE[a.cicloFormativoCodigo] ?? "gray")
                              : "gray"
                          }
                        >
                          {cicloBadgeLabel}
                        </Badge>
                      </td>

                      <td>{formatCursoCiclo(a.cursoCiclo)}</td>

                      <td className="whitespace-nowrap">{a.curso}</td>

                      <td>{a.telefono}</td>

                      <td className="text-blue-600 text-[0.82rem]">
                        <span className="block max-w-[220px] truncate" title={a.email ?? "-"}>
                          {a.email}
                        </span>
                      </td>

                      <td className="text-[0.8rem] text-text-mid">
                        {a.cvNombre ? "Adjunto" : "-"}
                      </td>

                      <td>
                        <TdActions>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onVer(a)}
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            {"\u{1F441}\uFE0F"}
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEditar(a)}
                          >
                            {"\u270F\uFE0F"}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onEliminar(a.id)}
                          >
                            {"\u{1F5D1}\uFE0F"}
                          </Button>
                        </TdActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={total}
          perPage={perPage}
          onPageChange={onPageChange}
        />
      </Card>
    </>
  );
}
