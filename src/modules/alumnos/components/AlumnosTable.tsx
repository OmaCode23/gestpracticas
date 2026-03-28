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
import { CICLOS, CURSOS, CICLO_BADGE, CICLO_LABEL } from "@/shared/catalogs/academico";
import type { Alumno } from "@/modules/alumnos/types";

interface AlumnosTableProps {
  alumnos: Alumno[];
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
  onEditar: (alumno: Alumno) => void;
  onEliminar: (id: number) => void;
}

export default function AlumnosTable({
  alumnos,
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
  onEditar,
  onEliminar,
}: AlumnosTableProps) {
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
            {CICLOS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={curso}
            onChange={onChangeCurso}
          >
            <option value="">Todos los cursos</option>
            {CURSOS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onChangeSearch}
            placeholder="Buscar alumno, NIA, NIF o NUSS..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIA</th>
                <th>NIF</th>
                <th>NUSS</th>
                <th>Ciclo</th>
                <th>Curso</th>
                <th>Telefono</th>
                <th>Correo</th>
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
                  const cicloCode = CICLO_LABEL[a.ciclo] ?? a.ciclo;

                  return (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.nombre}</strong>
                      </td>

                      <td className="text-text-mid">{a.nia}</td>

                      <td className="text-text-mid">{a.nif ?? "-"}</td>

                      <td className="text-text-mid">{a.nuss ?? "-"}</td>

                      <td>
                        <Badge variant={CICLO_BADGE[cicloCode] ?? "gray"}>
                          {cicloCode}
                        </Badge>
                      </td>

                      <td>{a.curso}</td>

                      <td>{a.telefono ?? "-"}</td>

                      <td className="text-blue-600 text-[0.82rem]">
                        {a.email ?? "-"}
                      </td>

                      <td>
                        <TdActions>
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
