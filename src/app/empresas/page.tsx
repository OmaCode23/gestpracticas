"use client";

/**
 * app/empresas/page.tsx
 *
 * Página de gestión de empresas — datos mock, sin BD.
 * TODO: Conectar con la API real cuando esté lista.
 */

import { useState } from "react";
import {
  PageHeader, SectionLabel, Card, CardHeader, CardTitle, Tag,
  FormRow, FormGroup, Button, TableFilters, TdActions, Badge,
  INPUT_CLS, type BadgeVariant,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import { MOCK_EMPRESAS, SECTORES, LOCALIDADES, CICLOS } from "@/shared/mockData";

const SECTOR_BADGE: Record<string, BadgeVariant> = {
  "Informática / TIC":   "blue",
  "Sanidad":             "green",
  "Hostelería / Turismo":"amber",
  "Electricidad":        "purple",
  "Administración":      "gray",
};

const CICLO_BADGE: Record<string, BadgeVariant> = {
  DAM: "blue", DAW: "amber", ASIR: "green", SMR: "purple", ADG: "gray",
};

const EMPTY_FORM = { nombre: "", cif: "", direccion: "", localidad: "", sector: "", ciclo: "", telefono: "", email: "", contacto: "", emailContacto: "" };
const PER_PAGE = 5;

export default function EmpresasPage() {
  const [form, setForm]         = useState(EMPTY_FORM);
  const [empresas, setEmpresas] = useState(MOCK_EMPRESAS);
  const [sector, setSector]     = useState("");
  const [localidad, setLocalidad] = useState("");
  const [ciclo, setCiclo]       = useState("");
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  // Filtrado local — reemplazar por fetch a la API
  const filtered = empresas.filter(e =>
    (!sector   || e.sector   === sector)   &&
    (!localidad|| e.localidad=== localidad) &&
    (!ciclo    || e.ciclo    === ciclo)     &&
    (!search   || e.nombre.toLowerCase().includes(search.toLowerCase()) || e.cif.includes(search))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleGuardar = () => {
    if (!form.nombre || !form.cif) return alert("Nombre y CIF son obligatorios");
    // TODO: POST /api/empresas
    setEmpresas(prev => [{ id: Date.now(), ...form }, ...prev]);
    setForm(EMPTY_FORM);
  };

  const handleEliminar = (id: number) => {
    if (!confirm("¿Eliminar esta empresa?")) return;
    // TODO: DELETE /api/empresas/:id
    setEmpresas(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div>
      <PageHeader breadcrumb="Inicio" breadcrumbHighlight="/ Empresas" title="Gestión de Empresas" subtitle="Alta de nuevas empresas y consulta del directorio de colaboradoras." />

      {/* ── Formulario de alta ── */}
      <SectionLabel>Alta de empresa</SectionLabel>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="🏢" iconVariant="blue">Nueva Empresa</CardTitle>
          <Tag>📝 Formulario de alta</Tag>
        </CardHeader>
        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre de la empresa *"><input className={INPUT_CLS} value={form.nombre} onChange={e => set("nombre")(e.target.value)} placeholder="Ej: Tecnologías Mediterráneo S.L." /></FormGroup>
            <FormGroup label="CIF *"><input className={INPUT_CLS} value={form.cif} onChange={e => set("cif")(e.target.value)} placeholder="Ej: B12345678" /></FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Dirección *"><input className={INPUT_CLS} value={form.direccion} onChange={e => set("direccion")(e.target.value)} placeholder="Calle, número, piso..." /></FormGroup>
            <FormGroup label="Localidad *"><input className={INPUT_CLS} value={form.localidad} onChange={e => set("localidad")(e.target.value)} placeholder="Ej: Valencia" /></FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="Teléfono *"><input className={INPUT_CLS} value={form.telefono} onChange={e => set("telefono")(e.target.value)} placeholder="963 000 000" /></FormGroup>
            <FormGroup label="Sector *">
              <select className={INPUT_CLS} value={form.sector} onChange={e => set("sector")(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {SECTORES.map(s => <option key={s}>{s}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Ciclo formativo *">
              <select className={INPUT_CLS} value={form.ciclo} onChange={e => set("ciclo")(e.target.value)}>
                <option value="">— Seleccionar —</option>
                {CICLOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
          </FormRow>
          <FormRow cols={3}>
            <FormGroup label="Persona de contacto *"><input className={INPUT_CLS} value={form.contacto} onChange={e => set("contacto")(e.target.value)} placeholder="Nombre y apellidos" /></FormGroup>
            <FormGroup label="Correo empresa *"><input className={INPUT_CLS} type="email" value={form.email} onChange={e => set("email")(e.target.value)} placeholder="contacto@empresa.com" /></FormGroup>
            <FormGroup label="Correo contacto"><input className={INPUT_CLS} type="email" value={form.emailContacto} onChange={e => set("emailContacto")(e.target.value)} placeholder="responsable@empresa.com" /></FormGroup>
          </FormRow>
        </div>
        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setForm(EMPTY_FORM)}>✕ Limpiar</Button>
          <Button variant="primary" onClick={handleGuardar}>✓ Guardar empresa</Button>
        </div>
      </Card>

      {/* ── Tabla ── */}
      <SectionLabel>Directorio de empresas</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">Filtrar por:</span>
          <FilterSelect value={sector} onChange={v => { setSector(v); setPage(1); }}>
            <option value="">Todos los sectores</option>
            {SECTORES.map(s => <option key={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect value={localidad} onChange={v => { setLocalidad(v); setPage(1); }}>
            <option value="">Todas las localidades</option>
            {LOCALIDADES.map(l => <option key={l}>{l}</option>)}
          </FilterSelect>
          <FilterSelect value={ciclo} onChange={v => { setCiclo(v); setPage(1); }}>
            <option value="">Todos los ciclos</option>
            {CICLOS.map(c => <option key={c}>{c}</option>)}
          </FilterSelect>
          <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar empresa..." />
          <Button variant="primary" size="sm" className="ml-auto">+ Nueva empresa</Button>
        </TableFilters>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th><th>CIF</th><th>Localidad</th><th>Sector</th>
                <th>Ciclo</th><th>Contacto</th><th>Teléfono</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={8} className="text-center py-6 text-text-light">No se encontraron empresas.</td></tr>
                : paginated.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.nombre}</strong></td>
                    <td className="text-text-mid">{e.cif}</td>
                    <td>{e.localidad}</td>
                    <td><Badge variant={SECTOR_BADGE[e.sector] ?? "gray"}>{e.sector}</Badge></td>
                    <td><Badge variant={CICLO_BADGE[e.ciclo] ?? "gray"}>{e.ciclo}</Badge></td>
                    <td>{e.contacto}</td>
                    <td>{e.telefono}</td>
                    <td>
                      <TdActions>
                        {/* TODO: abrir modal de edición */}
                        <Button variant="secondary" size="sm">✏️</Button>
                        <Button variant="danger"    size="sm" onClick={() => handleEliminar(e.id)}>🗑️</Button>
                      </TdActions>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
