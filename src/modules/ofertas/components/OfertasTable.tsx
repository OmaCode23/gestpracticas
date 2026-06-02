"use client";

import {
  Badge,
  Button,
  Card,
  SectionLabel,
  TableFilters,
  TdActions,
  type BadgeVariant,
} from "@/components/ui";
import { FilterSelect, SearchBox } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import type { OfertaPractica } from "../types";
import { OFERTA_ESTADOS } from "../types/schema";

type CicloFormativoOption = {
  id: number;
  nombre: string;
  codigo: string | null;
};

type OfertasTableProps = {
  ofertas: OfertaPractica[];
  loading: boolean;
  page: number;
  total: number;
  perPage: number;
  estado: string;
  ciclo: string;
  search: string;
  ciclosFormativos: CicloFormativoOption[];
  onEstadoChange: (value: string) => void;
  onCicloChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onEdit: (oferta: OfertaPractica) => void;
  onDelete: (id: number) => void;
};

const ESTADO_META: Record<
  (typeof OFERTA_ESTADOS)[number],
  { label: string; variant: BadgeVariant }
> = {
  BORRADOR: { label: "Borrador", variant: "amber" },
  PUBLICADA: { label: "Publicada", variant: "green" },
  CERRADA: { label: "Cerrada", variant: "gray" },
};

export default function OfertasTable({
  ofertas,
  loading,
  page,
  total,
  perPage,
  estado,
  ciclo,
  search,
  ciclosFormativos,
  onEstadoChange,
  onCicloChange,
  onSearchChange,
  onPageChange,
  onEdit,
  onDelete,
}: OfertasTableProps) {
  return (
    <>
      <SectionLabel>Tabla de ofertas</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] font-medium text-text-light">Filtrar por:</span>

          <FilterSelect value={estado} onChange={onEstadoChange}>
            <option value="">Todos los estados</option>
            {OFERTA_ESTADOS.map((item) => (
              <option key={item} value={item}>
                {ESTADO_META[item].label}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect value={ciclo} onChange={onCicloChange}>
            <option value="">Todos los ciclos</option>
            {ciclosFormativos.map((item) => (
              <option key={item.id} value={item.nombre}>
                {item.codigo ? `${item.codigo} - ${item.nombre}` : item.nombre}
              </option>
            ))}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={onSearchChange}
            placeholder="Buscar oferta..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Oferta</th>
                <th>Empresa</th>
                <th>Ciclo</th>
                <th>Plazas</th>
                <th>Periodo</th>
                <th>Estado</th>
                <th>Requisitos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && ofertas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-text-light">
                    No se encontraron ofertas.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-text-light">
                    Cargando ofertas...
                  </td>
                </tr>
              ) : (
                ofertas.map((oferta) => {
                  const estadoMeta = ESTADO_META[oferta.estado];

                  return (
                    <tr key={oferta.id}>
                      <td>
                        <strong className="block max-w-[240px] truncate" title={oferta.titulo}>
                          {oferta.titulo}
                        </strong>
                        {oferta.descripcion ? (
                          <span
                            className="mt-1 block max-w-[260px] truncate text-[0.75rem] text-text-light"
                            title={oferta.descripcion}
                          >
                            {oferta.descripcion}
                          </span>
                        ) : null}
                      </td>
                      <td>{oferta.empresa}</td>
                      <td>
                        {oferta.cicloFormativo ? (
                          <Badge variant="blue">
                            {oferta.cicloFormativoCodigo ?? oferta.cicloFormativo}
                          </Badge>
                        ) : (
                          <Badge variant="gray">Todos</Badge>
                        )}
                      </td>
                      <td>{oferta.plazas}</td>
                      <td>{oferta.periodo ?? "-"}</td>
                      <td>
                        <Badge variant={estadoMeta.variant}>{estadoMeta.label}</Badge>
                      </td>
                      <td className="max-w-[220px] truncate" title={oferta.requisitos ?? ""}>
                        {oferta.requisitos ?? "-"}
                      </td>
                      <td>
                        <TdActions>
                          <Button variant="secondary" size="sm" onClick={() => onEdit(oferta)}>
                            {"✏️"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => onDelete(oferta.id)}>
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
