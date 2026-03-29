"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CICLOS_FORMATIVOS, CURSOS } from "@/shared/catalogs/academico";
import { Button } from "@/components/ui";
import SuccessToast from "@/components/ui/SuccessToast";
import type { Formacion, FormacionInput } from "../types";
import FormacionForm from "./FormacionForm";
import FormacionTable from "./FormacionTable";

const EMPTY_FORM: FormacionInput = {
  empresaId: 0,
  alumnoId: 0,
  curso: "",
  periodo: "",
  descripcion: "",
  tutorLaboral: "",
  emailTutorLaboral: "",
};

const PER_PAGE = 10;

export default function FormacionContainer() {
  const router = useRouter();
  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const formatCursoCiclo = (value?: number) => (value ? `${value}.\u00BA` : "-");

  const [form, setForm] = useState<FormacionInput>(EMPTY_FORM);
  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([]);
  const [alumnos, setAlumnos] = useState<
    { id: number; nombre: string; nia: string; nif: string | null; nuss: string | null }[]
  >([]);

  const [curso, setCurso] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [selectedFormacion, setSelectedFormacion] = useState<Formacion | null>(null);
  const [notification, setNotification] = useState("");

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToTable = () => {
    tableSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToForm = () => {
    formSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openNewForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormExpanded(true);
    requestAnimationFrame(scrollToForm);
  };

  const collapseForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormExpanded(false);
  };

  // Opciones de ciclo para el filtro (abreviatura visible)
  const cicloOptions = CICLOS_FORMATIVOS;

  // Cargar empresas y alumnos (para selects)
  async function cargarEmpresas() {
    const res = await fetch("/api/empresas?all=true", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setEmpresas(
        json.data.items.map((e: any) => ({ id: e.id, nombre: e.nombre }))
      );
    }
  }

  async function cargarAlumnos() {
    const res = await fetch("/api/alumnos?perPage=9999", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setAlumnos(
        json.data.items.map((a: any) => ({
          id: a.id,
          nombre: a.nombre,
          nia: a.nia,
          nif: a.nif ?? null,
          nuss: a.nuss ?? null,
        }))
      );
    }
  }

  // Cargar formaciones
  async function load(opts?: { pageOverride?: number }) {
    try {
      setLoading(true);

      const currentPage = opts?.pageOverride ?? page;

      const params = new URLSearchParams();
      if (curso) params.set("curso", curso);
      if (ciclo) params.set("ciclo", ciclo);
      if (search) params.set("search", search);
      params.set("page", String(currentPage));
      params.set("perPage", String(PER_PAGE));

      const res = await fetch(`/api/formacion?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setFormaciones(json.data.items);
      setTotal((prev) => (prev === json.data.total ? prev : json.data.total));
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las formaciones.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarEmpresas();
    cargarAlumnos();
  }, []);

  // Filtros inmediatos (selectores y paginación)
  useEffect(() => {
    load();
  }, [curso, ciclo, page]);

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

  // Guardar / Actualizar
  const handleGuardar = async () => {
    if (!form.empresaId || !form.alumnoId || !form.curso || !form.periodo) {
      alert("Rellena todos los campos obligatorios.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `/api/formacion/${editingId}` : "/api/formacion",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );

      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setIsFormExpanded(false);
      await reloadToFirstPage();
      scrollToTable();
      router.refresh();

      setNotification(
        isEditing
          ? "Formación actualizada correctamente."
          : "Formación creada correctamente."
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la formación.");
    } finally {
      setSaving(false);
    }
  };

  // Editar
  const handleEditar = (f: Formacion) => {
    setIsFormExpanded(true);
    setForm({
      empresaId: f.empresaId,
      alumnoId: f.alumnoId,
      curso: f.curso,
      periodo: f.periodo,
      descripcion: f.descripcion ?? "",
      tutorLaboral: f.tutorLaboral ?? "",
      emailTutorLaboral: f.emailTutorLaboral ?? "",
    });

    setEditingId(f.id);
    requestAnimationFrame(scrollToForm);
  };

  // Eliminar
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta formación?")) return;

    try {
      const res = await fetch(`/api/formacion/${id}`, { method: "DELETE" });
      const json = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await load();
      router.refresh();
      setNotification("Formación eliminada correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la formación.");
    }
  };

  const handleLimpiar = () => {
    if (editingId !== null) {
      collapseForm();
      scrollToTable();
      return;
    }

    setForm(EMPTY_FORM);
  };

  const handleCollapseForm = () => {
    collapseForm();
    scrollToTable();
  };

  return (
    <>
      <SuccessToast message={notification} onClose={() => setNotification("")} />

      <div ref={tableSectionRef}>
        <FormacionTable
          formaciones={formaciones}
          loading={loading}
          page={page}
          total={total}
          perPage={PER_PAGE}
          curso={curso}
          ciclo={ciclo}
          search={search}
          cursos={CURSOS}
          ciclos={cicloOptions}
          onCursoChange={(v) => {
            setCurso(v);
            setPage(1);
          }}
          onCicloChange={(v) => {
            setCiclo(v);
            setPage(1);
          }}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onPageChange={setPage}
          onView={setSelectedFormacion}
          onEdit={handleEditar}
          onDelete={handleEliminar}
        />
      </div>

      <div ref={formSectionRef} className="mt-10">
        {isFormExpanded ? (
          <FormacionForm
            form={form}
            saving={saving}
            editingId={editingId}
            empresas={empresas}
            alumnos={alumnos}
            cursos={CURSOS}
            onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
            onClear={handleLimpiar}
            onSave={handleGuardar}
            onToggleCollapse={handleCollapseForm}
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

      {selectedFormacion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c20]/45 p-4">
          <div className="max-h-[85vh] w-full max-w-6xl overflow-y-auto rounded-[24px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(43,28,32,0.24)]">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Detalle
                </p>
                <h2 className="mt-1 text-xl font-semibold text-navy">
                  {selectedFormacion.alumno?.nombre
                    ? `Formacion de ${selectedFormacion.alumno.nombre}`
                    : "Formacion en empresa"}
                </h2>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedFormacion(null)}>
                Cerrar
              </Button>
            </div>

            <div className="grid gap-5 p-6 xl:grid-cols-3">
              <section className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Datos del alumno
                </p>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Alumno</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.alumno?.nombre ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NIA</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.alumno?.nia ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NIF</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.alumno?.nif ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">NUSS</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.alumno?.nuss ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Ciclo</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.alumno?.ciclo ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Curso ciclo</p>
                    <p className="mt-1 font-medium text-navy">{formatCursoCiclo(selectedFormacion.alumno?.cursoCiclo)}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Datos de la empresa
                </p>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Empresa</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.empresa?.nombre ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Tutor laboral</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.tutorLaboral ?? "-"}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3 sm:col-span-2">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Email tutor laboral</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.emailTutorLaboral ?? "-"}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Datos de la formacion
                </p>
                <div className="grid gap-3">
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Curso Academico</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.curso}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Periodo</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.periodo}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface px-4 py-3">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Descripcion</p>
                    <p className="mt-1 font-medium text-navy">{selectedFormacion.descripcion ?? "-"}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
