"use client";

import {
  Badge,
  Button,
  Card,
  SectionLabel,
  TableFilters,
  TdActions,
} from "@/components/ui";
import { FilterSelect, SearchBox } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import type { CursoExterno } from "../types";

type CursosTableProps = {
  cursos: CursoExterno[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  activo: string;
  search: string;
  onActivoChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (curso: CursoExterno) => void;
  onDelete: (id: number) => void;
};

export default function CursosTable({
  cursos,
  loading,
  page,
  total,
  perPage,
  activo,
  search,
  onActivoChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: CursosTableProps) {
  return (
    <>
      <SectionLabel>Listado de cursos</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] font-medium text-text-light">Filtrar por:</span>

          <FilterSelect value={activo} onChange={onActivoChange}>
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar curso..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Curso</th>
                <th>Proveedor</th>
                <th>Area</th>
                <th>Nivel</th>
                <th>Modalidad</th>
                <th>Duracion</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && cursos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-text-light">
                    No se encontraron cursos.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-text-light">
                    Cargando cursos...
                  </td>
                </tr>
              ) : (
                cursos.map((curso) => (
                  <tr key={curso.id}>
                    <td>
                      <strong className="block max-w-[240px] truncate" title={curso.titulo}>
                        {curso.titulo}
                      </strong>
                      {curso.descripcion ? (
                        <span
                          className="mt-1 block max-w-[260px] truncate text-[0.75rem] text-text-light"
                          title={curso.descripcion}
                        >
                          {curso.descripcion}
                        </span>
                      ) : null}
                    </td>
                    <td>{curso.proveedor}</td>
                    <td>{curso.area}</td>
                    <td>
                      <Badge variant="amber">{curso.nivel}</Badge>
                    </td>
                    <td>{curso.modalidad}</td>
                    <td>{curso.duracion ?? "-"}</td>
                    <td>
                      <Badge variant={curso.activo ? "green" : "gray"}>
                        {curso.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td>
                      <TdActions>
                        <Button variant="secondary" size="sm" onClick={() => onEdit(curso)}>
                          {"✏️"}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => onDelete(curso.id)}>
                          {"\u{1F5D1}️"}
                        </Button>
                      </TdActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={total} perPage={perPage} onPageChange={onPageChange} />
      </Card>
    </>
  );
}
