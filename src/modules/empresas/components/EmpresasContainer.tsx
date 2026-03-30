"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, type BadgeVariant } from "@/components/ui";
import { CICLO_BADGE, CICLO_LABEL } from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import type { Empresa, PaginatedEmpresas, EmpresaInput } from "../types";
import EmpresaForm from "./EmpresaForm";
import EmpresasTable from "./EmpresasTable";

const SECTOR_BADGE: Record<string, BadgeVariant> = {
  "Informática / TIC": "blue",
  "Informatica / TIC": "blue",
  Sanidad: "green",
  "Hostelería / Turismo": "amber",
  "Hosteleria / Turismo": "amber",
  Electricidad: "purple",
  "Administración": "gray",
  Administracion: "gray",
};

const EMPTY_FORM: EmpresaInput = {
  nombre: "",
  cif: "",
  direccion: "",
  localidad: "",
  sector: "",
  cicloFormativo: "",
  telefono: "",
  email: "",
  contacto: "",
  emailContacto: "",
};

const PER_PAGE = 5;

type EmpresaCatalogos = {
  sectores: string[];
  localidades: string[];
  ciclosFormativos: string[];
};

export default function EmpresasContainer() {
  const router = useRouter();
  const [form, setForm] = useState<EmpresaInput>(EMPTY_FORM);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sector, setSector] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [catalogos, setCatalogos] = useState<EmpresaCatalogos>({
    sectores: [],
    localidades: [],
    ciclosFormativos: [],
  });

  const handleFormChange = (key: keyof EmpresaInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function cargarEmpresas() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (sector) params.set("sector", sector);
      if (localidad) params.set("localidad", localidad);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/empresas?${params.toString()}`, {
        cache: "no-store",
      });

      const json: ApiResponse<PaginatedEmpresas> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setEmpresas(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las empresas.");
    } finally {
      setLoading(false);
    }
  }

  async function cargarCatalogos() {
    try {
      const res = await fetch("/api/catalogos/empresas", {
        cache: "no-store",
      });
      const json: ApiResponse<EmpresaCatalogos> = await res.json();

      if (!json.ok) {
        throw new Error(json.error);
      }

      setCatalogos(json.data);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los catalogos de empresas.");
    }
  }

  useEffect(() => {
    cargarEmpresas();
  }, [sector, localidad, search, page]);

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  useEffect(() => {
    if (!notification) return;

    const timeoutId = window.setTimeout(() => {
      setNotification("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [notification]);

  const handleGuardar = async () => {
    if (!form.nombre || !form.cif || !form.localidad || !form.sector) {
      alert("Nombre, CIF, localidad y sector son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = editingId !== null;
      const res = await fetch(
        isEditing ? `/api/empresas/${editingId}` : "/api/empresas",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const json: ApiResponse<Empresa> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      const notificationMessage = isEditing
        ? "Empresa actualizada correctamente."
        : "Empresa creada correctamente.";

      setForm(EMPTY_FORM);
      setEditingId(null);
      setIsFormOpen(false);
      setPage(1);
      await cargarEmpresas();
      router.refresh();
      setNotification(notificationMessage);
    } catch (error) {
      console.error(error);
      alert(
        editingId !== null
          ? "No se pudo actualizar la empresa."
          : "No se pudo guardar la empresa."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = (empresa: Empresa) => {
    setForm({
      nombre: empresa.nombre,
      cif: empresa.cif,
      direccion: empresa.direccion ?? "",
      localidad: empresa.localidad,
      sector: empresa.sector,
      cicloFormativo: empresa.cicloFormativo ?? "",
      telefono: empresa.telefono ?? "",
      email: empresa.email ?? "",
      contacto: empresa.contacto ?? "",
      emailContacto: empresa.emailContacto ?? "",
    });

    setEditingId(empresa.id);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("Eliminar esta empresa?")) return;

    try {
      const res = await fetch(`/api/empresas/${id}`, {
        method: "DELETE",
      });

      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarEmpresas();
      router.refresh();
      setNotification("Empresa eliminada correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la empresa.");
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
                aria-label="Cerrar notificación"
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
          variant={isFormOpen ? "secondary" : "primary"}
          onClick={() => {
            if (isFormOpen) {
              handleLimpiar();
              setIsFormOpen(false);
              return;
            }

            setIsFormOpen(true);
          }}
        >
          {isFormOpen ? "Ocultar formulario" : "+ Agregar nueva empresa"}
        </Button>
      </div>

      <div
        className={[
          "overflow-hidden transition-[max-height,opacity,transform,margin] duration-300 ease-out motion-reduce:transition-none",
          isFormOpen
            ? "mb-7 max-h-[1200px] translate-y-0 opacity-100"
            : "pointer-events-none mb-0 max-h-0 -translate-y-2 opacity-0",
        ].join(" ")}
        aria-hidden={!isFormOpen}
      >
        <EmpresaForm
          form={form}
          saving={saving}
          editingId={editingId}
          ciclosFormativos={catalogos.ciclosFormativos}
          localidades={catalogos.localidades}
          sectores={catalogos.sectores}
          onChange={handleFormChange}
          onClear={handleLimpiar}
          onSave={handleGuardar}
        />
      </div>

      <EmpresasTable
        empresas={empresas}
        loading={loading}
        page={page}
        total={total}
        perPage={PER_PAGE}
        sector={sector}
        localidad={localidad}
        search={search}
        sectores={catalogos.sectores}
        localidades={catalogos.localidades}
        cicloBadge={CICLO_BADGE}
        cicloLabel={CICLO_LABEL}
        sectorBadge={SECTOR_BADGE}
        onSectorChange={(value) => {
          setSector(value);
          setPage(1);
        }}
        onLocalidadChange={(value) => {
          setLocalidad(value);
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
