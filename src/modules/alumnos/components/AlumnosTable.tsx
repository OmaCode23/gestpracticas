/**
 * modules/alumnos/components/AlumnosTable.tsx  —  Client Component
 */

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
import { CICLOS, CURSOS } from "@/shared/mockData";
import type { BadgeVariant } from "@/components/ui";
import type { Alumno } from "@/modules/alumnos/types";

const CICLO_BADGE: Record<string, BadgeVariant> = {
  DAM: "blue",
  DAW: "amber",
  ASIR: "green",
  SMR: "purple",
  ADG: "gray",
};

const PER_PAGE = 5;

interface AlumnosTableProps {
  alumnos: Alumno[];
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
  const filtered = alumnos.filter(a =>
    (!ciclo || a.ciclo === ciclo) &&
    (!curso || a.curso === curso) &&
    (!search ||
      a.nombre.toLowerCase().includes(search.toLowerCase()) ||
      a.nia.includes(search))
  );

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
            onChange={v => {
              onChangeCiclo(v);
              onPageChange(1);
            }}
          >
            <option value="">Todos los ciclos</option>
            {CICLOS.map(c => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={curso}
            onChange={v => {
              onChangeCurso(v);
              onPageChange(1);
            }}
          >
            <option value="">Todos los cursos</option>
            {CURSOS.map(c => (
              <option key={c}>{c}</option>
            ))}
          </FilterSelect>
          <SearchBox
            value={search}
            onChange={v => {
              onChangeSearch(v);
              onPageChange(1);
            }}
            placeholder="Buscar alumno o NIA..."
          />
          <Button variant="primary" size="sm" className="ml-auto">
            + Nuevo alumno
          </Button>
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIA</th>
                <th>Ciclo</th>
                <th>Curso</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-6 text-text-light"
                  >
                    No se encontraron alumnos.
                  </td>
                </tr>
              ) : (
                paginated.map(a => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.nombre}</strong>
                    </td>
                    <td className="text-text-mid">{a.nia}</td>
                    <td>
                      <Badge variant={CICLO_BADGE[a.ciclo] ?? "gray"}>
                        {a.ciclo}
                      </Badge>
                    </td>
                    <td>{a.curso}</td>
                    <td>{a.telefono}</td>
                    <td className="text-blue-600 text-[0.82rem]">
                      {a.email}
                    </td>
                    <td>
                      <TdActions>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onEditar(a)}
                        >
                          ✏️
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onEliminar(a.id)}
                        >
                          🗑️
                        </Button>
                      </TdActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          total={filtered.length}
          perPage={PER_PAGE}
          onPageChange={onPageChange}
        />
      </Card>
    </>
  );
}
