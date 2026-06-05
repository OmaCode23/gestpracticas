"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { DEFAULT_RESULTADOS_POR_PAGINA } from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import { ofertaPracticaSchema } from "../types/schema";
import type { OfertaPractica, PaginatedOfertasPracticas } from "../types";
import OfertaForm, { type OfertaFormState } from "./OfertaForm";
import OfertasTable from "./OfertasTable";

type CicloFormativoOption = {
  id: number;
  nombre: string;
  codigo: string | null;
  activo?: boolean;
};

type EmpresaOption = {
  id: number;
  nombre: string;
};

const EMPTY_FORM: OfertaFormState = {
  titulo: "",
  empresaId: "",
  cicloFormativoId: "",
  plazas: "1",
  requisitos: "",
  periodo: "",
  descripcion: "",
  estado: "PUBLICADA",
};

export default function OfertasContainer({
  resultadosPorPagina = DEFAULT_RESULTADOS_POR_PAGINA,
}: {
  resultadosPorPagina?: number;
}) {
  const router = useRouter();
  const formWrapperRef = useRef<HTMLDivElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const [form, setForm] = useState<OfertaFormState>(EMPTY_FORM);
  const [ofertas, setOfertas] = useState<OfertaPractica[]>([]);
  const [estado, setEstado] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [empresas, setEmpresas] = useState<EmpresaOption[]>([]);
  const [ciclosFormativos, setCiclosFormativos] = useState<CicloFormativoOption[]>([]);
  const [formCiclos, setFormCiclos] = useState<CicloFormativoOption[]>([]);

  const handleFormChange = (key: keyof OfertaFormState, value: string) => {
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

  async function cargarOfertas() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (estado) params.set("estado", estado);
      if (ciclo) params.set("ciclo", ciclo);
      if (search) params.set("search", search);
      params.set("page", String(page));
      params.set("limit", String(resultadosPorPagina));

      const res = await fetch(`/api/ofertas?${params.toString()}`, { cache: "no-store" });
      const json: ApiResponse<PaginatedOfertasPracticas> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setOfertas(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las ofertas.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarEmpresas() {
    try {
      const res = await fetch("/api/empresas?all=true&fields=picker", { cache: "no-store" });
      const json: ApiResponse<{
        items: EmpresaOption[];
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
      }> = await res.json();

      if (!json.ok) throw new Error(json.error);

      setEmpresas(json.data.items);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las empresas.");
    }
  }

  async function cargarCiclos() {
    try {
      const res = await fetch("/api/catalogos/ciclos-formativos", { cache: "no-store" });
      const json: ApiResponse<CicloFormativoOption[]> = await res.json();

      if (!json.ok) throw new Error(json.error);

      const activos = json.data.filter((item) => item.activo !== false);
      setCiclosFormativos(activos);
      setFormCiclos(activos);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los ciclos formativos.");
    }
  }

  useEffect(() => {
    void cargarOfertas();
  }, [estado, ciclo, search, page, resultadosPorPagina]);

  useEffect(() => {
    void cargarCiclos();
    void cargarEmpresas();
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => setNotification(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const handleGuardar = async () => {
    const parsed = ofertaPracticaSchema.safeParse({
      ...form,
      empresaId: form.empresaId || undefined,
      cicloFormativoId: form.cicloFormativoId || null,
    });

    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    try {
      setSaving(true);
      const isEditing = editingId !== null;
      const res = await fetch(isEditing ? `/api/ofertas/${editingId}` : "/api/ofertas", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const json: ApiResponse<OfertaPractica> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setEditingId(null);
      closeForm();
      setPage(1);
      await cargarOfertas();
      router.refresh();
      setNotification(
        isEditing ? "Oferta actualizada correctamente." : "Oferta creada correctamente."
      );
    } catch (error) {
      console.error(error);
      alert(editingId !== null ? "No se pudo actualizar la oferta." : "No se pudo guardar la oferta.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (oferta: OfertaPractica) => {
    const cicloActualInactivo =
      oferta.cicloFormativoId &&
      oferta.cicloFormativo &&
      !ciclosFormativos.some((c) => c.id === oferta.cicloFormativoId)
        ? [
            {
              id: oferta.cicloFormativoId,
              nombre: `${oferta.cicloFormativo} (inactivo)`,
              codigo: oferta.cicloFormativoCodigo,
            },
          ]
        : [];

    setFormCiclos([...ciclosFormativos, ...cicloActualInactivo]);
    setForm({
      titulo: oferta.titulo,
      empresaId: oferta.empresaId ? String(oferta.empresaId) : "",
      cicloFormativoId: oferta.cicloFormativoId ? String(oferta.cicloFormativoId) : "",
      plazas: String(oferta.plazas),
      requisitos: oferta.requisitos ?? "",
      periodo: oferta.periodo ?? "",
      descripcion: oferta.descripcion ?? "",
      estado: oferta.estado,
    });
    setEditingId(oferta.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar esta oferta?")) return;

    try {
      const res = await fetch(`/api/ofertas/${id}`, { method: "DELETE" });
      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarOfertas();
      router.refresh();
      setNotification("Oferta eliminada correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la oferta.");
    }
  };

  const handleLimpiar = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
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

            setFormCiclos(ciclosFormativos);
            setIsFormOpen(true);
          }}
        >
          {isFormOpen ? "Ocultar formulario" : "+ Agregar nueva oferta"}
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
        <OfertaForm
          form={form}
          saving={saving}
          editingId={editingId}
          empresas={empresas}
          ciclosFormativos={formCiclos}
          onChange={handleFormChange}
          onClear={handleLimpiar}
          onSave={handleGuardar}
        />
      </div>

      <OfertasTable
        ofertas={ofertas}
        loading={loading}
        page={page}
        total={total}
        perPage={resultadosPorPagina}
        estado={estado}
        ciclo={ciclo}
        search={search}
        ciclosFormativos={ciclosFormativos}
        onEstadoChange={(value) => {
          setEstado(value);
          setPage(1);
        }}
        onCicloChange={(value) => {
          setCiclo(value);
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
    </>
  );
}
