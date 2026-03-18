/**
 * modules/alumnos/components/AlumnosContainer.tsx  —  Client Component
 */

"use client";

import { useEffect, useState } from "react";
import { PageHeader, SectionLabel } from "@/components/ui";
import AlumnoForm from "./AlumnoForm";
import AlumnosTable from "./AlumnosTable";
import type { Alumno } from "@/modules/alumnos/types";

const EMPTY = {
  nombre: "",
  nia: "",
  telefono: "",
  email: "",
  ciclo: "",
  curso: "",
};

export default function AlumnosContainer() {
  const [form, setForm] = useState(EMPTY);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [ciclo, setCiclo] = useState("");
  const [curso, setCurso] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);

  const setFormField = (field: keyof typeof EMPTY, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  // Cargar alumnos desde la API
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
      if (json.ok) setAlumnos(json.data);
    }

    load();
  }, [ciclo, curso, search, page]);

  const reload = async () => {
    const res = await fetch("/api/alumnos");
    const json = await res.json();
    if (json.ok) setAlumnos(json.data);
  };

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

    setForm(EMPTY);
    setPage(1);
    await reload();
  };

  const handleActualizar = async () => {
    if (!editingId) return;

    const res = await fetch(`/api/alumnos/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();
    if (!json.ok) {
      return alert(json.error ?? "Error al actualizar");
    }

    setEditingId(null);
    setForm(EMPTY);
    await reload();
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este alumno?")) return;

    const res = await fetch(`/api/alumnos/${id}`, {
      method: "DELETE",
    });

    const json = await res.json();
    if (!json.ok) {
      return alert(json.error ?? "Error al eliminar");
    }

    await reload();
  };

  const handleEditar = (alumno: Alumno) => {
    setEditingId(alumno.id);
    setForm({
      nombre: alumno.nombre,
      nia: alumno.nia,
      telefono: alumno.telefono ?? "",
      email: alumno.email ?? "",
      ciclo: alumno.ciclo,
      curso: alumno.curso,
    });
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Alumnos"
        title="Gestión de Alumnos"
        subtitle="Alta de alumnos en prácticas y consulta del censo por ciclo y curso."
      />

      <SectionLabel>Alta de alumno</SectionLabel>
      <AlumnoForm
        form={form}
        onChange={setFormField}
        onGuardar={handleGuardar}
        onActualizar={handleActualizar}
        onCancelarEdicion={handleCancelarEdicion}
        isEditing={editingId !== null}
        onLimpiar={() => setForm(EMPTY)}
      />

      <AlumnosTable
        alumnos={alumnos}
        ciclo={ciclo}
        curso={curso}
        search={search}
        page={page}
        onChangeCiclo={setCiclo}
        onChangeCurso={setCurso}
        onChangeSearch={setSearch}
        onPageChange={setPage}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />
    </div>
  );
}
