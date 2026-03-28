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
import { CICLO_BADGE, CICLO_LABEL } from "@/shared/catalogs/academico";

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
                {c}
              </option>
            ))}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar empresa, alumno, NIA, NIF o NUSS..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Alumno</th>
                <th>NIA</th>
                <th>NIF</th>
                <th>NUSS</th>
                <th>Ciclo</th>
                <th>Curso</th>
                <th>Periodo</th>
                <th>Empresa</th>
                <th>Contacto</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-text-light">
                    Cargando formaciones...
                  </td>
                </tr>
              ) : formaciones.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-6 text-text-light">
                    No se encontraron formaciones.
                  </td>
                </tr>
              ) : (
                formaciones.map((f) => {
                  const cicloCode = f.alumno?.ciclo
                    ? CICLO_LABEL[f.alumno.ciclo] ?? f.alumno.ciclo
                    : "-";

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

                      <td className="text-text-mid">{f.alumno?.nif ?? "-"}</td>

                      <td className="text-text-mid">{f.alumno?.nuss ?? "-"}</td>

                      <td>
                        <Badge variant={CICLO_BADGE[cicloCode] ?? "gray"}>
                          {cicloCode}
                        </Badge>
                      </td>

                      <td>{f.curso}</td>

                      <td>{f.periodo}</td>

                      <td>
                        <strong className="block max-w-[220px] truncate" title={f.empresa?.nombre}>
                          {f.empresa?.nombre ?? "-"}
                        </strong>
                      </td>

                      <td>{f.contacto ?? "-"}</td>

                      <td>
                        <TdActions>
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
