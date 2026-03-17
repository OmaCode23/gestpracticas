"use client";

/**
 * app/formacion/page.tsx
 * TODO: Conectar con /api/formacion cuando esté lista la BD.
 */

import { useState } from "react";
import {
  PageHeader, SectionLabel, Card, CardHeader, CardTitle, Tag,
  FormRow, FormGroup, Button, TableFilters, TdActions, Badge,
  INPUT_CLS,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import { MOCK_FORMACIONES, MOCK_EMPRESAS, MOCK_ALUMNOS, CURSOS } from "@/shared/mockData";

const EMPTY = { empresa: "", alumno: "", periodo: "", descripcion: "", contacto: "", curso: "" };
const PER_PAGE = 5;

export default function FormacionPage() {
  const [form, setForm]               = useState(EMPTY);
  const [formaciones, setFormaciones] = useState(MOCK_FORMACIONES);
  const [curso,  setCurso]            = useState("");
  const [search, setSearch]           = useState("");
  const [page,   setPage]             = useState(1);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  const filtered = formaciones.filter(f =>
    (!curso  || f.curso === curso) &&
    (!search || f.empresa.toLowerCase().includes(search.toLowerCase()) ||
                f.alumno.toLowerCase().includes(search.toLowerCase()))
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleGuardar = () => {
    if (!form.empresa || !form.alumno || !form.curso) return alert("Empresa, alumno y curso son obligatorios");
    // TODO: POST /api/formacion
    setFormaciones(prev => [{ id: Date.now(), ...form }, ...prev]);
    setForm(EMPTY);
  };

  const handleEliminar = (id: number) => {
    if (!confirm("¿Eliminar esta formación?")) return;
    // TODO: DELETE /api/formacion/:id
    setFormaciones(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Formación Empresa"
        title="Formación en Empresa"
        subtitle="Alta de formaciones FCT/Dual y consulta filtrada por curso académico."
      />

      {/* ── Formulario ── */}
      <SectionLabel>Alta de formación en empresa</SectionLabel>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="📋" iconVariant="amber">Nueva Formación en Empresa</CardTitle>
          <Tag>📝 Formulario de alta</Tag>
        </CardHeader>
        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Empresa *">
              <select className={INPUT_CLS} value={form.empresa} onChange={e => set("empresa")(e.target.value)}>
                <option value="">— Seleccionar empresa —</option>
                {MOCK_EMPRESAS.map(e => (
                  <option key={e.id} value={e.nombre}>{e.nombre}</option>
                ))}
              </select>
            </FormGroup>
            <FormGroup label="Alumno *">
              <select className={INPUT_CLS} value={form.alumno} onChange={e => set("alumno")(e.target.value)}>
                <option value="">— Seleccionar alumno —</option>
                {MOCK_ALUMNOS.map(a => (
                  <option key={a.id} value={a.nombre}>{a.nombre} ({a.nia})</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Periodo *">
              <input className={INPUT_CLS} value={form.periodo} onChange={e => set("periodo")(e.target.value)} placeholder="Ej: Mar–Jun 2025" />
            </FormGroup>
            <FormGroup label="Curso académico *">
              <select className={INPUT_CLS} value={form.curso} onChange={e => set("curso")(e.target.value)}>
                <option value="">— Seleccionar curso —</option>
                {CURSOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Descripción *">
              <input className={INPUT_CLS} value={form.descripcion} onChange={e => set("descripcion")(e.target.value)} placeholder="Ej: Desarrollo de aplicaciones web" />
            </FormGroup>
            <FormGroup label="Persona de contacto *">
              <input className={INPUT_CLS} value={form.contacto} onChange={e => set("contacto")(e.target.value)} placeholder="Nombre del tutor laboral" />
            </FormGroup>
          </FormRow>
        </div>
        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setForm(EMPTY)}>✕ Limpiar</Button>
          <Button variant="primary" onClick={handleGuardar}>✓ Guardar formación</Button>
        </div>
      </Card>

      {/* ── Tabla ── */}
      <SectionLabel>Listado de formaciones</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">Filtrar por curso:</span>
          <FilterSelect value={curso} onChange={v => { setCurso(v); setPage(1); }}>
            <option value="">Todos los cursos</option>
            {CURSOS.map(c => <option key={c}>{c}</option>)}
          </FilterSelect>
          <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar empresa o alumno..." />
          <Button variant="primary" size="sm" className="ml-auto">+ Nueva formación</Button>
        </TableFilters>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th><th>Alumno</th><th>Periodo</th>
                <th>Descripción</th><th>Contacto</th><th>Curso</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={7} className="text-center py-6 text-text-light">No se encontraron formaciones.</td></tr>
                : paginated.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.empresa}</strong></td>
                    <td>{f.alumno}</td>
                    <td className="text-text-mid">{f.periodo}</td>
                    <td className="text-text-mid" style={{ maxWidth: 200 }}>
                      <span className="block truncate">{f.descripcion}</span>
                    </td>
                    <td>{f.contacto}</td>
                    <td><Badge variant="gray">{f.curso}</Badge></td>
                    <td>
                      <TdActions>
                        <Button variant="secondary" size="sm">✏️</Button>
                        <Button variant="danger"    size="sm" onClick={() => handleEliminar(f.id)}>🗑️</Button>
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
