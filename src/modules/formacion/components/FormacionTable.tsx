"use client";

import {
  SectionLabel,
  Card,
  TableFilters,
  TdActions,
  Button,
  Badge,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import type { Formacion } from "../types";
import { CICLO_BADGE } from "@/shared/catalogs/academico";

interface FormacionTableProps {
  formaciones: Formacion[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  curso: string;
  ciclo: string;
  cursoCiclo: string;
  search: string;
  cursos: string[];
  ciclos: { id: number; nombre: string; codigo: string | null }[];
  onCursoChange: (value: string) => void;
  onCicloChange: (value: string) => void;
  onCursoCicloChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onView: (f: Formacion) => void;
  onEdit: (f: Formacion) => void;
  onDelete: (f: Formacion) => void;
}

export default function FormacionTable({
  formaciones,
  loading,
  page,
  total,
  perPage,
  curso,
  ciclo,
  cursoCiclo,
  search,
  cursos,
  ciclos,
  onCursoChange,
  onCicloChange,
  onCursoCicloChange,
  onSearchChange,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: FormacionTableProps) {
  const formatCursoCiclo = (value: number) => `${value}.\u00BA`;

  return (
    <>
      <SectionLabel>Listado de formaciones</SectionLabel>

      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">
            Filtrar por:
          </span>

          <FilterSelect value={curso} onChange={onCursoChange}>
            <option value="">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={ciclo} onChange={onCicloChange}>
            <option value="">Todos los ciclos</option>
            {ciclos.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.codigo ?? c.nombre}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={cursoCiclo} onChange={onCursoCicloChange}>
            <option value="">Todos los cursos ciclo</option>
            <option value="1">1.º</option>
            <option value="2">2.º</option>
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar empresa, alumno o NIA..."
            className="max-w-[280px]"
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table className="[&_th]:px-3 [&_td]:px-3">
            <thead>
              <tr>
                <th>Alumno</th>
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
                  Académico
                </th>
                <th>Empresa</th>
                <th>Tutor laboral</th>
                <th>Periodo</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-text-light">
                    Cargando formaciones...
                  </td>
                </tr>
              ) : formaciones.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-text-light">
                    No se encontraron formaciones.
                  </td>
                </tr>
              ) : (
                formaciones.map((f) => {
                  const cicloBadgeLabel =
                    f.alumno?.cicloFormativoCodigo ??
                    f.alumno?.cicloFormativoNombre ??
                    "-";

                  return (
                    <tr key={f.id}>
                      <td>
                        <strong
                          className="block max-w-[220px] truncate"
                          title={f.alumno?.nombre}
                        >
                          {f.alumno?.nombre ?? "-"}
                        </strong>
                      </td>

                      <td className="text-text-mid">{f.alumno?.nia ?? "-"}</td>

                      <td>
                        <Badge
                          variant={
                            f.alumno?.cicloFormativoCodigo
                              ? (CICLO_BADGE[f.alumno.cicloFormativoCodigo] ?? "gray")
                              : "gray"
                          }
                        >
                          {cicloBadgeLabel}
                        </Badge>
                      </td>

                      <td>{f.alumno?.cursoCiclo ? formatCursoCiclo(f.alumno.cursoCiclo) : "-"}</td>

                      <td className="whitespace-nowrap">{f.curso}</td>

                      <td>
                        <strong className="block max-w-[220px] truncate" title={f.empresa?.nombre}>
                          {f.empresa?.nombre ?? "-"}
                        </strong>
                      </td>

                      <td>
                        <span
                          className="block max-w-[220px] truncate"
                          title={f.emailTutorLaboral ?? "-"}
                        >
                          {f.emailTutorLaboral ?? "-"}
                        </span>
                      </td>

                      <td>{f.periodo}</td>

                      <td>
                        <TdActions>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onView(f)}
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            {"\u{1F441}\uFE0F"}
                          </Button>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEdit(f)}
                          >
                            {"\u270F\uFE0F"}
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(f)}
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
