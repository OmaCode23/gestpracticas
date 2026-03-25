"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const PER_PAGE = 10;

export default function AlumnosContainer() {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);

  const [ciclo, setCiclo] = useState("");
  const [curso, setCurso] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState("");

  const setFormField = (field: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ------------------------------
  // Cargar alumnos
  // ------------------------------
  async function load(opts?: { pageOverride?: number }) {
    try {
      setLoading(true);

      const currentPage = opts?.pageOverride ?? page;

      const params = new URLSearchParams();
      if (ciclo) params.set("ciclo", ciclo);
      if (curso) params.set("curso", curso);
      if (search) params.set("search", search);
      params.set("page", String(currentPage));
      params.set("perPage", String(PER_PAGE));

      const res = await fetch(`/api/alumnos?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setAlumnos(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los alumnos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [ciclo, curso, search, page]);

  const reloadToFirstPage = async () => {
    setPage(1);
    await load({ pageOverride: 1 });
  };

  // ------------------------------
  // Guardar
  // ------------------------------
  const handleGuardar = async () => {
    if (!form.nombre || !form.nia || !form.ciclo || !form.curso) {
      return alert("Rellena los campos obligatorios.");
    }

    try {
      setSaving(true);

      const res = await fetch("/api/alumnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY);
      await reloadToFirstPage();
      router.refresh();

      setNotification("Alumno creado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo crear el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------
  // Actualizar
  // ------------------------------
  const handleActualizar = async () => {
    if (!editingId) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/alumnos/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setEditingId(null);
      setForm(EMPTY);
      await load();
      router.refresh();

      setNotification("Alumno actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------
  // Eliminar
  // ------------------------------
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar este alumno?")) return;

    try {
      const res = await fetch(`/api/alumnos/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await load();
      router.refresh();

      setNotification("Alumno eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el alumno.");
    }
  };

  // ------------------------------
  // Editar
  // ------------------------------
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

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  // ------------------------------
  // Notificación temporal
  // ------------------------------
  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  return (
    <div>
      {notification && (
        <div className="fixed top-5 right-5 z-50 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
          <div className="rounded-2xl border border-green-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(22,163,74,0.18)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-green-600">
                  Operación completada
                </p>
                <p className="mt-1 text-[0.92rem] font-medium text-navy">
                  {notification}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotification("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-light transition-colors hover:bg-surface hover:text-navy"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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
        total={total}
        perPage={PER_PAGE}
        ciclo={ciclo}
        curso={curso}
        search={search}
        page={page}
        onChangeCiclo={(v) => {
          setCiclo(v);
          setPage(1);
        }}
        onChangeCurso={(v) => {
          setCurso(v);
          setPage(1);
        }}
        onChangeSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onPageChange={setPage}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
      />
    </div>
  );
}
