"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CICLO_LABEL, CICLOS, CURSOS } from "@/shared/catalogs/academico";
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
  contacto: "",
};

const PER_PAGE = 10;

export default function FormacionContainer() {
  const router = useRouter();

  const [form, setForm] = useState<FormacionInput>(EMPTY_FORM);
  const [formaciones, setFormaciones] = useState<Formacion[]>([]);
  const [empresas, setEmpresas] = useState<{ id: number; nombre: string }[]>([]);
  const [alumnos, setAlumnos] = useState<
    { id: number; nombre: string; nia: string }[]
  >([]);

  const [curso, setCurso] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [notification, setNotification] = useState("");

  // Opciones de ciclo para el filtro (abreviatura visible)
  const cicloOptions = CICLOS;

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
    load();
  }, [curso, ciclo, search, page]);

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
      await reloadToFirstPage();
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
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  return (
    <>
      <SuccessToast message={notification} onClose={() => setNotification("")} />

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
        onEdit={handleEditar}
        onDelete={handleEliminar}
      />
    </>
  );
}
