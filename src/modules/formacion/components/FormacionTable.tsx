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
import { CICLO_BADGE, getCicloLabel } from "@/shared/catalogs/academico";

interface FormacionTableProps {
  formaciones: Formacion[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  curso: string;
  ciclo: string;
  search: string;
  cursos: string[];
  ciclos: string[];
  onCursoChange: (value: string) => void;
  onCicloChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onView: (f: Formacion) => void;
  onEdit: (f: Formacion) => void;
  onDelete: (id: number) => void;
}

export default function FormacionTable({
  formaciones,
  loading,
  page,
  total,
  perPage,
  curso,
  ciclo,
  search,
  cursos,
  ciclos,
  onCursoChange,
  onCicloChange,
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
              <option key={c} value={c}>
                {getCicloLabel(c)}
              </option>
            ))}
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
                  Academico
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
                  const cicloCode = getCicloLabel(f.alumno?.ciclo);

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
                        <Badge variant={CICLO_BADGE[cicloCode] ?? "gray"}>
                          {cicloCode}
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
                            onClick={() => onDelete(f.id)}
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
