"use client";

/**
 * app/alumnos/page.tsx
 * Conectado a /api/alumnos (BD real)
 */

import { useState, useEffect } from "react";
import {
  PageHeader, SectionLabel, Card, CardHeader, CardTitle, Tag,
  FormRow, FormGroup, Button, TableFilters, TdActions, Badge,
  INPUT_CLS, type BadgeVariant,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import { CICLOS, CURSOS } from "@/shared/mockData";
import type { Alumno } from "@/modules/alumnos/types";


const CICLO_BADGE: Record<string, BadgeVariant> = {
  DAM: "blue", DAW: "amber", ASIR: "green", SMR: "purple", ADG: "gray",
};

const EMPTY = { nombre: "", nia: "", telefono: "", email: "", ciclo: "", curso: "" };
const PER_PAGE = 5;

export default function AlumnosPage() {
  const [form, setForm]       = useState(EMPTY);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [ciclo,  setCiclo]    = useState("");
  const [curso,  setCurso]    = useState("");
  const [search, setSearch]   = useState("");
  const [page,   setPage]     = useState(1);

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));


  // Cargar Alumnos reales desde la API
  useEffect(() => {
    async function load() {
      const params = new URLSearchParams();
      if (ciclo) params.set("ciclo", ciclo);
      if (curso) params.set("curso", curso);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/alumnos?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();
      if (json.ok) {
        setAlumnos(json.data);
      }
    }

    load();
  }, [ciclo, curso, search, page]);

  // Crear Alumno (POST)
  const handleGuardar = async () => {
    if (!form.nombre || !form.nia || !form.ciclo || !form.curso) {
      return alert("Rellena los campos obligatorios");
    }

    const res = await fetch("/api/alumnos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!json.ok) {
      return alert(json.error ?? "Error al crear el alumno");
    }

    // Recargar lista
    setForm(EMPTY);
    setPage(1);

    const reload = await fetch("/api/alumnos");
    const reloadJson = await reload.json();
    setAlumnos(reloadJson.data);
  };

  // Eliminar Alumno (DELETE)
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este alumno?")) return;

    const res = await fetch(`/api/alumnos/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();

    if (!json.ok) {
      return alert(json.error ?? "Error al eliminar");
    }

    // Recargar lista
    const reload = await fetch("/api/alumnos");
    const reloadJson = await reload.json();
    setAlumnos(reloadJson.data);
  };


  // Filtros + paginación local (UI)
  const filtered = alumnos.filter(a =>
    (!ciclo  || a.ciclo === ciclo)  &&
    (!curso  || a.curso === curso)  &&
    (!search || a.nombre.toLowerCase().includes(search.toLowerCase()) || a.nia.includes(search))
  );

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Alumnos"
        title="Gestión de Alumnos"
        subtitle="Alta de alumnos en prácticas y consulta del censo por ciclo y curso."
      />

      {/* ── Formulario ── */}
      <SectionLabel>Alta de alumno</SectionLabel>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="👩‍🎓" iconVariant="green">Nuevo Alumno</CardTitle>
          <Tag>📝 Formulario de alta</Tag>
        </CardHeader>
        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre completo *">
              <input className={INPUT_CLS} value={form.nombre} onChange={e => set("nombre")(e.target.value)} placeholder="Nombre y apellidos" />
            </FormGroup>
            <FormGroup label="NIA *">
              <input className={INPUT_CLS} value={form.nia} onChange={e => set("nia")(e.target.value)} placeholder="Número de identificación" />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Teléfono *">
              <input className={INPUT_CLS} value={form.telefono} onChange={e => set("telefono")(e.target.value)} placeholder="6XX XXX XXX" />
            </FormGroup>
            <FormGroup label="Correo electrónico *">
              <input className={INPUT_CLS} type="email" value={form.email} onChange={e => set("email")(e.target.value)} placeholder="alumno@educa.gva.es" />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Ciclo formativo *">
              <select className={INPUT_CLS} value={form.ciclo} onChange={e => set("ciclo")(e.target.value)}>
                <option value="">— Seleccionar ciclo —</option>
                {CICLOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Curso académico *">
              <select className={INPUT_CLS} value={form.curso} onChange={e => set("curso")(e.target.value)}>
                <option value="">— Seleccionar curso —</option>
                {CURSOS.map(c => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
          </FormRow>
        </div>
        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setForm(EMPTY)}>✕ Limpiar</Button>
          <Button variant="primary" onClick={handleGuardar}>✓ Guardar alumno</Button>
        </div>
      </Card>

      {/* ── Tabla ── */}
      <SectionLabel>Listado de alumnos</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">Filtrar por:</span>
          <FilterSelect value={ciclo} onChange={v => { setCiclo(v); setPage(1); }}>
            <option value="">Todos los ciclos</option>
            {CICLOS.map(c => <option key={c}>{c}</option>)}
          </FilterSelect>
          <FilterSelect value={curso} onChange={v => { setCurso(v); setPage(1); }}>
            <option value="">Todos los cursos</option>
            {CURSOS.map(c => <option key={c}>{c}</option>)}
          </FilterSelect>
          <SearchBox value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Buscar alumno o NIA..." />
          <Button variant="primary" size="sm" className="ml-auto">+ Nuevo alumno</Button>
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Nombre</th><th>NIA</th><th>Ciclo</th><th>Curso</th>
                <th>Teléfono</th><th>Correo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0
                ? <tr><td colSpan={7} className="text-center py-6 text-text-light">No se encontraron alumnos.</td></tr>
                : paginated.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.nombre}</strong></td>
                    <td className="text-text-mid">{a.nia}</td>
                    <td><Badge variant={CICLO_BADGE[a.ciclo] ?? "gray"}>{a.ciclo}</Badge></td>
                    <td>{a.curso}</td>
                    <td>{a.telefono}</td>
                    <td className="text-blue-600 text-[0.82rem]">{a.email}</td>
                    <td>
                      <TdActions>
                        <Button variant="secondary" size="sm">✏️</Button>
                        <Button variant="danger" size="sm" onClick={() => handleEliminar(a.id)}>🗑️</Button>
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
