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
import type { Profesor } from "../types";

type CatalogoOption = { id: number; nombre: string };

type ProfesoresTableProps = {
  profesores: Profesor[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  ciclo: string;
  search: string;
  ciclosFormativos: Array<{ id: number; nombre: string; codigo: string | null }>;
  cicloBadge: Record<string, BadgeVariant>;
  onCicloChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (profesor: Profesor) => void;
  onDelete: (id: number) => void;
};

export default function ProfesoresTable({
  profesores,
  loading,
  page,
  total,
  perPage,
  ciclo,
  search,
  ciclosFormativos,
  cicloBadge,
  onCicloChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: ProfesoresTableProps) {
  return (
    <>
      <SectionLabel>Directorio de profesores</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] font-medium text-text-light">Filtrar por:</span>

          <FilterSelect value={ciclo} onChange={onCicloChange}>
            <option value="">Todos los ciclos</option>
            {ciclosFormativos.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar profesor..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>NIF</th>
                <th>Especialidad</th>
                <th>Ciclo</th>
                <th>Telefono</th>
                <th>Correo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && profesores.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-text-light">
                    No se encontraron profesores.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-text-light">
                    Cargando profesores...
                  </td>
                </tr>
              ) : (
                profesores.map((p) => {
                  const cicloCode = p.cicloFormativoCodigo ?? p.cicloFormativo ?? "-";

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong className="block max-w-[220px] truncate" title={p.nombre}>
                          {p.nombre}
                        </strong>
                      </td>
                      <td className="text-text-mid">{p.nif ?? "-"}</td>
                      <td>{p.especialidad ?? "-"}</td>
                      <td>
                        {p.cicloFormativo ? (
                          <Badge variant={cicloBadge[cicloCode] ?? "gray"}>{cicloCode}</Badge>
                        ) : (
                          <span className="text-text-light">-</span>
                        )}
                      </td>
                      <td>{p.telefono ?? "-"}</td>
                      <td className="max-w-[180px] truncate" title={p.email ?? ""}>
                        {p.email ?? "-"}
                      </td>
                      <td>
                        <TdActions>
                          <Button variant="secondary" size="sm" onClick={() => onEdit(p)}>
                            {"✏️"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => onDelete(p.id)}>
                            {"\u{1F5D1}️"}
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

        <Pagination page={page} total={total} perPage={perPage} onPageChange={onPageChange} />
      </Card>
    </>
  );
}
