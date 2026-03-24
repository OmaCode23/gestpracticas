/**
 * src/modules/formacion/components/FormacionTable.tsx  —  Client Component
 */

"use client";

import {
  SectionLabel,
  Card,
  TableFilters,
  TdActions,
  Button,
  Badge,
  type BadgeVariant,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import type { FormacionEmpresa } from "../types";
import { CICLO_BADGE, CICLO_LABEL } from "@/shared/catalogs/academico";

type FormacionTableProps = {
  formaciones: FormacionEmpresa[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  curso: string;
  search: string;
  cursos: string[];
  onCursoChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (f: FormacionEmpresa) => void;
  onDelete: (id: number) => void;
};

export default function FormacionTable({
  formaciones,
  loading,
  page,
  total,
  perPage,
  curso,
  search,
  cursos,
  onCursoChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: FormacionTableProps) {
  return (
    <>
      <SectionLabel>Listado de formaciones</SectionLabel>

      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">
            Filtrar por:
          </span>

          {/* Filtro por curso */}
          <FilterSelect value={curso} onChange={onCursoChange}>
            <option value="">Todos los cursos</option>
            {cursos.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>

          {/* Búsqueda */}
          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar empresa, alumno o NIA..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Alumno</th>
                <th>NIA</th>
                <th>Ciclo</th>
                <th>Curso</th>
                <th>Periodo</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {/* Sin resultados */}
              {!loading && formaciones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    No se encontraron formaciones.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    Cargando formaciones...
                  </td>
                </tr>
              ) : (
                formaciones.map((f) => {
                  const cicloCode =
                    f.alumno?.ciclo
                      ? CICLO_LABEL[f.alumno.ciclo] ?? f.alumno.ciclo
                      : "—";

                  return (
                    <tr key={f.id}>
                      <td>
                        <strong className="block max-w-[220px] truncate" title={f.empresa?.nombre}>
                          {f.empresa?.nombre ?? "—"}
                        </strong>
                      </td>

                      <td>{f.alumno?.nombre ?? "—"}</td>

                      <td className="text-text-mid">{f.alumno?.nia ?? "—"}</td>

                      <td>
                        <Badge variant={CICLO_BADGE[cicloCode] ?? "gray"}>
                          {cicloCode}
                        </Badge>
                      </td>

                      <td>{f.curso}</td>

                      <td>{f.periodo}</td>

                      <td>{f.contacto ?? "—"}</td>

                      <td>
                        <TdActions>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEdit(f)}
                          >
                            ✏️
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onDelete(f.id)}
                          >
                            🗑️
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


