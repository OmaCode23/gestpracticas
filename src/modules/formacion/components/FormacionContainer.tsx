/**
 * src/modules/formacion/components/FormacionContainer.tsx  —  Client Component
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CURSOS } from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import type { FormacionEmpresa, FormacionCreateInput } from "../types";
import FormacionForm from "./FormacionForm";
import FormacionTable from "./FormacionTable";

const EMPTY_FORM: FormacionCreateInput = {
  empresaId: 0,
  alumnoId: 0,
  curso: "",
  periodo: "",
  descripcion: "",
  contacto: "",
};

const PER_PAGE = 10;

export default function FormacionContainer() {
  const router = useRouter();

  const [form, setForm] = useState<FormacionCreateInput>(EMPTY_FORM);
  const [formaciones, setFormaciones] = useState<FormacionEmpresa[]>([]);
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([]);
  const [alumnos, setAlumnos] = useState<{ id: number; nombre: string; nia: string }[]>([]);

  const [curso, setCurso] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState("");


  // Cargar empresas y alumnos (para selects)
  async function cargarEmpresas() {
    const res = await fetch("/api/empresas?perPage=9999", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setEmpresas(json.data.items.map((e: any) => ({ id: e.id, nombre: e.nombre })));
    }
  }

  async function cargarAlumnos() {
    const res = await fetch("/api/alumnos?perPage=9999", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) {
      setAlumnos(
        json.data.data.map((a: any) => ({
          id: a.id,
          nombre: a.nombre,
          nia: a.nia,
        }))
      );
    }
  }

  // Cargar formaciones
  async function cargarFormaciones() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (curso) params.set("curso", curso);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/formacion?${params.toString()}`, {
        cache: "no-store",
      });

      const json: ApiResponse<any> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setFormaciones(json.data.items);
      setTotal(json.data.total);
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

  useEffect(() => {
    cargarFormaciones();
  }, [curso, search, page]);

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

      const json: ApiResponse<FormacionEmpresa> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      setPage(1);
      await cargarFormaciones();
      router.refresh();

      setNotification(
        isEditing ? "Formación actualizada correctamente." : "Formación creada correctamente."
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la formación.");
    } finally {
      setSaving(false);
    }
  };

  // Editar
  const handleEditar = (f: FormacionEmpresa) => {
    setForm({
      empresaId: f.empresaId,
      alumnoId: f.alumnoId,
      curso: f.curso,
      periodo: f.periodo,
      descripcion: f.descripcion ?? "",
      contacto: f.contacto ?? "",
    });

    setEditingId(f.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Eliminar
  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta formación?")) return;

    try {
      const res = await fetch(`/api/formacion/${id}`, { method: "DELETE" });
      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarFormaciones();
      router.refresh();
      setNotification("Formación eliminada correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la formación.");
    }
  };

  const handleLimpiar = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  // Notificación temporal
  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

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
      />

      <FormacionTable
        formaciones={formaciones}
        loading={loading}
        page={page}
        total={total}
        perPage={PER_PAGE}
        curso={curso}
        search={search}
        cursos={CURSOS}
        onCursoChange={(v) => {
          setCurso(v);
          setPage(1);
        }}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        onPageChange={setPage}
        onEdit={handleEditar}
        onDelete={handleEliminar}
      />
    </>
  );
}

