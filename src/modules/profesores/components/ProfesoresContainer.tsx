"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type BadgeVariant } from "@/components/ui";
import {
  CICLO_BADGE,
  DEFAULT_RESULTADOS_POR_PAGINA,
} from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import { profesorSchema } from "../types/schema";
import type { Profesor, PaginatedProfesores, ProfesorInput } from "../types";
import ProfesorForm from "./ProfesorForm";
import ProfesoresTable from "./ProfesoresTable";

type ProfesorFormState = Omit<ProfesorInput, "cicloFormativoId"> & {
  cicloFormativoId: string;
};

const EMPTY_FORM: ProfesorFormState = {
  nombre: "",
  nif: "",
  especialidad: "",
  telefono: "",
  email: "",
  cicloFormativoId: "",
};

type CicloFormativoOption = { id: number; nombre: string; codigo: string | null };

export default function ProfesoresContainer({
  resultadosPorPagina = DEFAULT_RESULTADOS_POR_PAGINA,
}: {
  resultadosPorPagina?: number;
}) {
  const router = useRouter();
  const formWrapperRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const [form, setForm] = useState<ProfesorFormState>(EMPTY_FORM);
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [ciclo, setCiclo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [originalEditingEmail, setOriginalEditingEmail] = useState<string | null>(null);
  const [notification, setNotification] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ciclosFormativos, setCiclosFormativos] = useState<CicloFormativoOption[]>([]);
  const [formCiclos, setFormCiclos] = useState<CicloFormativoOption[]>([]);

  const handleFormChange = (key: keyof ProfesorFormState, value: string) => {
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
    setFormCiclos(ciclosFormativos);
  };

  async function cargarProfesores() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ciclo) params.set("ciclo", ciclo);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(resultadosPorPagina));

      const res = await fetch(`/api/profesores?${params.toString()}`, { cache: "no-store" });
      const json: ApiResponse<PaginatedProfesores> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setProfesores(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los profesores.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarCiclos() {
    try {
      const res = await fetch("/api/catalogos/ciclos-formativos", { cache: "no-store" });
      const json: ApiResponse<CicloFormativoOption[]> = await res.json();

      if (!json.ok) throw new Error(json.error);

      setCiclosFormativos(json.data);
      setFormCiclos(json.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    void cargarProfesores();
  }, [ciclo, search, page, resultadosPorPagina]);

  useEffect(() => {
    void cargarCiclos();
  }, []);

  useEffect(() => {
    if (!notification) return;
    const id = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(id);
  }, [notification]);

  const handleGuardar = async () => {
    const parsed = profesorSchema.safeParse({
      ...form,
      cicloFormativoId: form.cicloFormativoId || null,
    });

    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `/api/profesores/${editingId}` : "/api/profesores",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        }
      );

      const json: ApiResponse<Profesor> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setOriginalEditingEmail(null);
      closeForm();
      setPage(1);
      await cargarProfesores();
      router.refresh();
      setNotification(
        isEditing ? "Profesor actualizado correctamente." : "Profesor creado correctamente."
      );
    } catch (error) {
      console.error(error);
      alert(editingId !== null ? "No se pudo actualizar el profesor." : "No se pudo guardar el profesor.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (profesor: Profesor) => {
    const cicloActualInactivo =
      profesor.cicloFormativoId &&
      profesor.cicloFormativo &&
      !ciclosFormativos.some((c) => c.id === profesor.cicloFormativoId)
        ? [{ id: profesor.cicloFormativoId, nombre: `${profesor.cicloFormativo} (inactivo)`, codigo: null }]
        : [];

    setFormCiclos([...ciclosFormativos, ...cicloActualInactivo]);
    setForm({
      nombre: profesor.nombre,
      nif: profesor.nif ?? "",
      especialidad: profesor.especialidad ?? "",
      telefono: profesor.telefono ?? "",
      email: profesor.email ?? "",
      cicloFormativoId: profesor.cicloFormativoId ? String(profesor.cicloFormativoId) : "",
    });
    setEditingId(profesor.id);
    setOriginalEditingEmail(profesor.email ?? null);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar este profesor?")) return;

    try {
      const res = await fetch(`/api/profesores/${id}`, { method: "DELETE" });
      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarProfesores();
      router.refresh();
      setNotification("Profesor eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el profesor.");
    }
  };

  const handleLimpiar = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setOriginalEditingEmail(null);
    setFormCiclos(ciclosFormativos);
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
            setFormCiclos(ciclosFormativos);
            setIsFormOpen(true);
          }}
        >
          {isFormOpen ? "Ocultar formulario" : "+ Agregar nuevo profesor"}
        </Button>
      </div>

      <div
        ref={formWrapperRef}
        className={[
          "overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out motion-reduce:transition-none",
          isFormOpen
            ? "mb-7 max-h-[900px] translate-y-0 opacity-100"
            : "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <ProfesorForm
          form={form}
          saving={saving}
          editingId={editingId}
          originalEmail={originalEditingEmail}
          ciclosFormativos={formCiclos}
          onChange={handleFormChange}
          onClear={handleLimpiar}
          onSave={handleGuardar}
        />
      </div>

      <ProfesoresTable
        profesores={profesores}
        loading={loading}
        page={page}
        total={total}
        perPage={resultadosPorPagina}
        ciclo={ciclo}
        search={search}
        ciclosFormativos={ciclosFormativos}
        cicloBadge={CICLO_BADGE}
        onCicloChange={(value) => { setCiclo(value); setPage(1); }}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        onPageChange={setPage}
        onEdit={handleEditar}
        onDelete={handleEliminar}
      />
    </>
  );
}
