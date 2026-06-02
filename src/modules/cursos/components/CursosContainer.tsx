"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, SectionLabel } from "@/components/ui";
import { DEFAULT_RESULTADOS_POR_PAGINA } from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import { cursoExternoSchema } from "../types/schema";
import type { CursoExterno, PaginatedCursosExternos } from "../types";
import CursoForm, { type CursoFormState } from "./CursoForm";
import CursosTable from "./CursosTable";

const EMPTY_FORM: CursoFormState = {
  titulo: "",
  proveedor: "",
  area: "",
  nivel: "",
  modalidad: "Online",
  duracion: "",
  descripcion: "",
  enlace: "",
  activo: true,
};

export default function CursosContainer({
  resultadosPorPagina = DEFAULT_RESULTADOS_POR_PAGINA,
}: {
  resultadosPorPagina?: number;
}) {
  const router = useRouter();
  const formWrapperRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const [form, setForm] = useState<CursoFormState>(EMPTY_FORM);
  const [cursos, setCursos] = useState<CursoExterno[]>([]);
  const [activo, setActivo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFormChange = (key: keyof CursoFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const closeForm = () => {
    if (
      formWrapperRef.current &&
      document.activeElement instanceof HTMLElement &&
      formWrapperRef.current.contains(document.activeElement)
    ) {
      document.activeElement.blur();
      toggleButtonRef.current?.focus();
    }

    setIsFormOpen(false);
  };

  async function cargarCursos() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activo) params.set("activo", activo);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(resultadosPorPagina));

      const res = await fetch(`/api/cursos?${params.toString()}`, { cache: "no-store" });
      const json: ApiResponse<PaginatedCursosExternos> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setCursos(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los cursos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargarCursos();
  }, [activo, search, page, resultadosPorPagina]);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const handleGuardar = async () => {
    const parsed = cursoExternoSchema.safeParse(form);

    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const res = await fetch(isEditing ? `/api/cursos/${editingId}` : "/api/cursos", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json: ApiResponse<CursoExterno> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      closeForm();
      setPage(1);
      await cargarCursos();
      router.refresh();
      setNotification(
        isEditing ? "Curso actualizado correctamente." : "Curso creado correctamente."
      );
    } catch (error) {
      console.error(error);
      alert(editingId !== null ? "No se pudo actualizar el curso." : "No se pudo guardar el curso.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (curso: CursoExterno) => {
    setForm({
      titulo: curso.titulo,
      proveedor: curso.proveedor,
      area: curso.area,
      nivel: curso.nivel,
      modalidad: curso.modalidad,
      duracion: curso.duracion ?? "",
      descripcion: curso.descripcion ?? "",
      enlace: curso.enlace ?? "",
      activo: curso.activo,
    });
    setEditingId(curso.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar este curso?")) return;

    try {
      const res = await fetch(`/api/cursos/${id}`, { method: "DELETE" });
      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarCursos();
      router.refresh();
      setNotification("Curso eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el curso.");
    }
  };

  const handleLimpiar = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  return (
    <>
      {notification && (
        <div className="fixed top-5 right-5 z-50 w-full max-w-md animate-[fadeIn_0.2s_ease-out]">
          <div className="rounded-2xl border border-green-200 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(22,163,74,0.18)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-green-600">
                  Operacion completada
                </p>
                <p className="mt-1 text-[0.92rem] font-medium text-navy">{notification}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotification("")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-light transition-colors hover:bg-surface hover:text-navy"
                aria-label="Cerrar notificacion"
                title="Cerrar"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button
          ref={toggleButtonRef}
          variant={isFormOpen ? "secondary" : "primary"}
          onClick={() => {
            if (isFormOpen) {
              handleLimpiar();
              closeForm();
              return;
            }

            setIsFormOpen(true);
          }}
        >
          {isFormOpen ? "Ocultar formulario" : "+ Agregar nuevo curso"}
        </Button>
      </div>

      <div
        ref={formWrapperRef}
        className={[
          "overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out motion-reduce:transition-none",
          isFormOpen
            ? "mb-7 max-h-[1200px] translate-y-0 opacity-100"
            : "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <CursoForm
          form={form}
          saving={saving}
          editingId={editingId}
          onChange={handleFormChange}
          onClear={handleLimpiar}
          onSave={handleGuardar}
        />
      </div>

      <CursosTable
        cursos={cursos}
        loading={loading}
        page={page}
        total={total}
        perPage={resultadosPorPagina}
        activo={activo}
        search={search}
        onActivoChange={(value) => {
          setActivo(value);
          setPage(1);
        }}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onPageChange={setPage}
        onEdit={handleEditar}
        onDelete={handleEliminar}
      />

      <div className="mt-7">
        <SectionLabel>Vista de tarjetas</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cursos.map((curso) => (
            <Card key={curso.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Badge variant="amber">{curso.proveedor}</Badge>
                <Badge variant={curso.activo ? "green" : "gray"}>
                  {curso.activo ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <h2 className="mt-4 text-base font-bold text-navy">{curso.titulo}</h2>
              <div className="mt-3 grid gap-1.5 text-sm text-text-mid">
                <p>
                  <span className="font-semibold text-navy">Area:</span> {curso.area}
                </p>
                <p>
                  <span className="font-semibold text-navy">Nivel:</span> {curso.nivel}
                </p>
                <p>
                  <span className="font-semibold text-navy">Modalidad:</span> {curso.modalidad}
                </p>
              </div>
              {curso.descripcion ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-text-mid">
                  {curso.descripcion}
                </p>
              ) : null}
            </Card>
          ))}
          {!loading && cursos.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-text-mid">No hay cursos para mostrar como tarjetas.</p>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
