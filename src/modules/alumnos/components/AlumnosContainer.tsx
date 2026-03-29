"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import AlumnoForm from "./AlumnoForm";
import AlumnosTable from "./AlumnosTable";
import type { Alumno } from "@/modules/alumnos/types";
import SuccessToast from "@/components/ui/SuccessToast";

const EMPTY = {
  nombre: "",
  nia: "",
  nif: "",
  nuss: "",
  telefono: "",
  email: "",
  ciclo: "",
  cursoCiclo: "",
  curso: "",
};

const PER_PAGE = 10;

export default function AlumnosContainer() {
  const router = useRouter();
  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const formatCursoCiclo = (value: number) => `${value}.\u00BA`;

  const [form, setForm] = useState(EMPTY);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);

  const [ciclo, setCiclo] = useState("");
  const [curso, setCurso] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [selectedAlumno, setSelectedAlumno] = useState<Alumno | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notification, setNotification] = useState("");

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setFormField = (field: keyof typeof EMPTY, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const scrollToTable = () => {
    tableSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setIsFormExpanded(true);
    requestAnimationFrame(scrollToForm);
  };

  const collapseForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setIsFormExpanded(false);
  };

  // Cargar alumnos
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
      setTotal((prev) => (prev === json.data.total ? prev : json.data.total));
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los alumnos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [ciclo, curso, page]);

  // Search con debounce de 300ms
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      load();
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [search]);

  const reloadToFirstPage = async () => {
    setPage(1);
    await load({ pageOverride: 1 });
  };

  // Guardar
  const handleGuardar = async () => {
    if (
      !form.nombre ||
      !form.nia ||
      !form.telefono ||
      !form.email ||
      !form.ciclo ||
      !form.cursoCiclo ||
      !form.curso
    ) {
      return alert(
        "Rellena todos los campos obligatorios: nombre, NIA, telefono, correo, ciclo, curso ciclo y curso."
      );
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
      setIsFormExpanded(false);
      await reloadToFirstPage();
      scrollToTable();
      router.refresh();

      setNotification("Alumno creado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo crear el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // Actualizar
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
      setIsFormExpanded(false);
      await load();
      scrollToTable();
      router.refresh();

      setNotification("Alumno actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar este alumno?")) return;

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

  // Editar
  const handleEditar = (alumno: Alumno) => {
    setEditingId(alumno.id);
    setIsFormExpanded(true);
    setForm({
      nombre: alumno.nombre,
      nia: alumno.nia,
      nif: alumno.nif ?? "",
      nuss: alumno.nuss ?? "",
      telefono: alumno.telefono ?? "",
      email: alumno.email ?? "",
      ciclo: alumno.ciclo,
      cursoCiclo: String(alumno.cursoCiclo),
      curso: alumno.curso,
    });

    requestAnimationFrame(scrollToForm);
  };

  const handleCancelarEdicion = () => {
    collapseForm();
    scrollToTable();
  };

  // Notificacion temporal
  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  return (
    <>
      <SuccessToast message={notification} onClose={() => setNotification("")} />

      <div ref={tableSectionRef}>
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
          onVer={setSelectedAlumno}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
      </div>

      <div ref={formSectionRef} className="mt-10">
        {isFormExpanded ? (
          <AlumnoForm
            form={form}
            onChange={setFormField}
            onGuardar={handleGuardar}
            onActualizar={handleActualizar}
            onCancelarEdicion={handleCancelarEdicion}
            onToggleCollapse={handleCancelarEdicion}
            isEditing={editingId !== null}
            onLimpiar={() => setForm(EMPTY)}
          />
        ) : (
          <div className="mb-7">
            <div className="glass-panel flex w-full items-center justify-between rounded-[20px] border border-white/70 bg-white/84 px-5 py-4 shadow-card">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={openNewForm}
                  aria-label="Expandir formulario"
                  title="Expandir formulario"
                  className="px-2.5 text-[0.95rem]"
                >
                  {"\u25B8"}
                </Button>
                <Button variant="secondary" size="sm" onClick={openNewForm}>
                  Nueva alta
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedAlumno ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c20]/45 p-4">
          <div className="w-full max-w-4xl rounded-[24px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(43,28,32,0.24)]">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Detalle
                </p>
                <h2 className="mt-1 text-xl font-semibold text-navy">
                  {selectedAlumno.nombre}
                </h2>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedAlumno(null)}>
                Cerrar
              </Button>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Nombre</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.nombre}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NIA</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.nia}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NIF</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.nif ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NUSS</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.nuss ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Ciclo</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.ciclo}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Curso ciclo</p>
                <p className="mt-1 font-medium text-navy">{formatCursoCiclo(selectedAlumno.cursoCiclo)}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Curso</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.curso}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Telefono</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.telefono ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3 sm:col-span-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Correo</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.email ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
