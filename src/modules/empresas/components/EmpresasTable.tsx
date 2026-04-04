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
import type { CatalogoOption, Empresa } from "../types";
import LocalidadCombobox from "./LocalidadCombobox";

type EmpresasTableProps = {
  empresas: Empresa[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  sector: string;
  localidad: string;
  search: string;
  sectores: CatalogoOption[];
  localidades: CatalogoOption[];
  ciclosFormativos: Array<{ id: number; nombre: string; codigo: string | null }>;
  cicloBadge: Record<string, BadgeVariant>;
  sectorBadge: Record<string, BadgeVariant>;
  onSectorChange: (value: string) => void;
  onLocalidadChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (empresa: Empresa) => void;
  onDelete: (id: number) => void;
};

export default function EmpresasTable({
  empresas,
  loading,
  page,
  total,
  perPage,
  sector,
  localidad,
  search,
  sectores,
  localidades,
  ciclosFormativos,
  cicloBadge,
  sectorBadge,
  onSectorChange,
  onLocalidadChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: EmpresasTableProps) {
  return (
    <>
      <SectionLabel>Directorio de empresas</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">Filtrar por:</span>

          <FilterSelect value={sector} onChange={onSectorChange}>
            <option value="">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </FilterSelect>

          <div className="min-w-[280px] flex-1 max-w-[360px]">
            <LocalidadCombobox
              localidades={localidades}
              size="filter"
              value={localidad}
              onChange={onLocalidadChange}
              placeholder="Filtrar por localidad..."
            />
          </div>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar empresa..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CIF</th>
                <th>Localidad</th>
                <th>Sector</th>
                <th>Ciclo</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && empresas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    No se encontraron empresas.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    Cargando empresas...
                  </td>
                </tr>
              ) : (
                empresas.map((e) => {
                  const cicloCode =
                    ciclosFormativos.find((ciclo) => ciclo.nombre === e.cicloFormativo)?.codigo ??
                    e.cicloFormativo ??
                    "—";

                  return (
                    <tr key={e.id}>
                      <td>
                        <strong className="block max-w-[220px] truncate" title={e.nombre}>
                          {e.nombre}
                        </strong>
                      </td>
                      <td className="text-text-mid">{e.cif}</td>
                      <td>{e.localidad}</td>
                      <td>
                        <Badge variant={sectorBadge[e.sector] ?? "gray"}>
                          {e.sector}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={cicloBadge[cicloCode] ?? "gray"}>
                          {cicloCode}
                        </Badge>
                      </td>
                      <td>{e.contacto ?? "—"}</td>
                      <td>{e.telefono ?? "—"}</td>
                      <td>
                        <TdActions>
                          <Button variant="secondary" size="sm" onClick={() => onEdit(e)}>
                            ✏️
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => onDelete(e.id)}>
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

        <Pagination page={page} total={total} perPage={perPage} onPageChange={onPageChange} />
      </Card>
    </>
  );
}
