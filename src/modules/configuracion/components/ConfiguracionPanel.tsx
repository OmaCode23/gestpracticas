"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  INPUT_CLS,
  Tag,
} from "@/components/ui";
import {
  CICLO_BADGE,
  DEFAULT_MES_CAMBIO_CURSO,
  DEFAULT_NUMERO_CURSOS_VISIBLES,
  DEFAULT_RESULTADOS_POR_PAGINA,
} from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import SuccessToast from "@/components/ui/SuccessToast";

type CicloFormativoItem = {
  id: number;
  nombre: string;
  codigo: string | null;
  activo: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count: {
    alumnos: number;
    empresas: number;
  };
};

type ConfiguracionAcademica = {
  mesCambioCurso: number;
  numeroCursosVisibles: number;
  resultadosPorPagina: number;
};

type FormState = {
  nombre: string;
  codigo: string;
};

const EMPTY_FORM: FormState = {
  nombre: "",
  codigo: "",
};

const MONTH_OPTIONS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function isCicloInUse(ciclo: CicloFormativoItem) {
  return ciclo._count.alumnos > 0 || ciclo._count.empresas > 0;
}

export default function ConfiguracionPanel({
  ciclosFormativos: initialCiclosFormativos,
  configuracionAcademica: initialConfiguracionAcademica,
}: {
  ciclosFormativos: CicloFormativoItem[];
  configuracionAcademica: ConfiguracionAcademica;
}) {
  const router = useRouter();
  const [ciclosFormativos, setCiclosFormativos] =
    useState<CicloFormativoItem[]>(initialCiclosFormativos);
  const [configuracionAcademica, setConfiguracionAcademica] =
    useState<ConfiguracionAcademica>(initialConfiguracionAcademica);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [editingField, setEditingField] = useState<{
    id: number;
    field: "nombre" | "codigo";
    value: string;
  } | null>(null);
  const [savingCycle, setSavingCycle] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [savingAcademica, setSavingAcademica] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    setCiclosFormativos(initialCiclosFormativos);
  }, [initialCiclosFormativos]);

  useEffect(() => {
    setConfiguracionAcademica(initialConfiguracionAcademica);
  }, [initialConfiguracionAcademica]);

  const activos = ciclosFormativos.filter((item) => item.activo).length;

  function resetCreateForm() {
    setCreateForm(EMPTY_FORM);
  }

  function closeInlineEdit() {
    setEditingField(null);
  }

  async function reloadCiclos() {
    const res = await fetch("/api/catalogos/ciclos-formativos", {
      cache: "no-store",
    });
    const json: ApiResponse<CicloFormativoItem[]> = await res.json();

    if (!json.ok) {
      throw new Error(json.error);
    }

    setCiclosFormativos(json.data);
  }

  async function handleCreate() {
    if (!createForm.nombre.trim() || !createForm.codigo.trim()) {
      alert("Nombre y código son obligatorios.");
      return;
    }

    try {
      setSavingCycle(true);

      const res = await fetch("/api/catalogos/ciclos-formativos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const json: ApiResponse<CicloFormativoItem> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await reloadCiclos();
      router.refresh();
      resetCreateForm();
      setNotification("Ciclo formativo creado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar el ciclo formativo.");
    } finally {
      setSavingCycle(false);
    }
  }

  function openInlineEdit(ciclo: CicloFormativoItem, field: "nombre" | "codigo") {
    if (isCicloInUse(ciclo)) return;

    setEditingField({
      id: ciclo.id,
      field,
      value: field === "nombre" ? ciclo.nombre : ciclo.codigo ?? "",
    });
  }

  async function saveInlineEdit() {
    if (!editingField) return;

    if (!editingField.value.trim()) {
      alert(
        editingField.field === "nombre"
          ? "El nombre es obligatorio."
          : "El código es obligatorio."
      );
      return;
    }

    try {
      setSavingCycle(true);

      const res = await fetch(
        `/api/catalogos/ciclos-formativos/${editingField.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            [editingField.field]: editingField.value,
          }),
        }
      );

      const json: ApiResponse<CicloFormativoItem> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await reloadCiclos();
      router.refresh();
      closeInlineEdit();
      setNotification("Ciclo formativo actualizado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el ciclo formativo.");
    } finally {
      setSavingCycle(false);
    }
  }

  async function handleToggleActivo(ciclo: CicloFormativoItem) {
    try {
      const res = await fetch(`/api/catalogos/ciclos-formativos/${ciclo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !ciclo.activo }),
      });

      const json: ApiResponse<CicloFormativoItem> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await reloadCiclos();
      router.refresh();
      setNotification(
        ciclo.activo
          ? "Ciclo formativo desactivado correctamente."
          : "Ciclo formativo activado correctamente."
      );
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el estado del ciclo formativo.");
    }
  }

  async function handleDelete(ciclo: CicloFormativoItem) {
    if (isCicloInUse(ciclo)) {
      alert("No se puede eliminar porque el ciclo está en uso.");
      return;
    }

    const confirmed = window.confirm(
      `Se eliminará el ciclo "${ciclo.nombre}". Solo se puede borrar si no aparece en ningún registro. ¿Continuar?`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/catalogos/ciclos-formativos/${ciclo.id}`, {
        method: "DELETE",
      });

      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await reloadCiclos();
      router.refresh();
      setNotification("Ciclo formativo eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar el ciclo formativo.");
    }
  }

  async function handleRestoreBase() {
    const confirmed = window.confirm(
      "Se restaurarán los ciclos formativos iniciales de la aplicación. Se crearán los que falten y se reactivarán los iniciales inactivos. Los ciclos personalizados no se borrarán. ¿Continuar?"
    );

    if (!confirmed) return;

    try {
      setRestoring(true);

      const res = await fetch("/api/catalogos/ciclos-formativos/restaurar", {
        method: "POST",
      });

      const json: ApiResponse<{ total: number }> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await reloadCiclos();
      router.refresh();
      setNotification("Ciclos iniciales restaurados correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudieron restaurar los ciclos iniciales.");
    } finally {
      setRestoring(false);
    }
  }

  async function handleSaveConfiguracionAcademica() {
    try {
      setSavingAcademica(true);

      const res = await fetch("/api/settings/academico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configuracionAcademica),
      });

      const json: ApiResponse<ConfiguracionAcademica> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setConfiguracionAcademica(json.data);
      router.refresh();
      setNotification("Configuración guardada correctamente.");
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la configuración.");
    } finally {
      setSavingAcademica(false);
    }
  }

  async function handleRestoreConfiguracionAcademicaDefaults() {
    const defaults = {
      mesCambioCurso: DEFAULT_MES_CAMBIO_CURSO,
      numeroCursosVisibles: DEFAULT_NUMERO_CURSOS_VISIBLES,
      resultadosPorPagina: configuracionAcademica.resultadosPorPagina,
    };

    try {
      setSavingAcademica(true);

      const res = await fetch("/api/settings/academico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });

      const json: ApiResponse<ConfiguracionAcademica> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setConfiguracionAcademica(json.data);
      router.refresh();
      setNotification("Cursos académicos restaurados a valores por defecto.");
    } catch (error) {
      console.error(error);
      alert("No se pudieron restaurar los valores por defecto.");
    } finally {
      setSavingAcademica(false);
    }
  }

  async function handleRestoreResultadosPorPaginaDefault() {
    const defaults = {
      mesCambioCurso: configuracionAcademica.mesCambioCurso,
      numeroCursosVisibles: configuracionAcademica.numeroCursosVisibles,
      resultadosPorPagina: DEFAULT_RESULTADOS_POR_PAGINA,
    };

    try {
      setSavingAcademica(true);

      const res = await fetch("/api/settings/academico", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaults),
      });

      const json: ApiResponse<ConfiguracionAcademica> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setConfiguracionAcademica(json.data);
      router.refresh();
      setNotification("Resultados por página restaurados a valores por defecto.");
    } catch (error) {
      console.error(error);
      alert("No se pudieron restaurar los valores por defecto.");
    } finally {
      setSavingAcademica(false);
    }
  }

  return (
    <>
      <SuccessToast message={notification} onClose={() => setNotification("")} />

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <CardTitle icon="CF" iconVariant="purple">
              Ciclos formativos
            </CardTitle>
            <Tag>{`${activos} activos / ${ciclosFormativos.length} totales`}</Tag>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="min-w-full rounded-none bg-transparent text-left text-sm">
            <thead className="bg-surface">
              <tr className="text-[0.75rem] uppercase tracking-[0.08em] text-text-light">
                <th className="px-6 py-3 font-semibold">Nombre</th>
                <th className="px-6 py-3 font-semibold">Código</th>
                <th className="px-6 py-3 font-semibold">Modificado</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ciclosFormativos.map((ciclo) => (
                <tr
                  key={ciclo.id}
                  className="border-t border-border odd:bg-white even:bg-surface/40"
                >
                  <td className="px-6 py-4">
                    {editingField?.id === ciclo.id &&
                    editingField.field === "nombre" ? (
                      <div className="flex items-center gap-2">
                        <input
                          className={INPUT_CLS}
                          value={editingField.value}
                          onChange={(e) =>
                            setEditingField((prev) =>
                              prev ? { ...prev, value: e.target.value } : prev
                            )
                          }
                          maxLength={120}
                          autoFocus
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={saveInlineEdit}
                          disabled={savingCycle}
                        >
                          {savingCycle ? "..." : "OK"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={closeInlineEdit}
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => openInlineEdit(ciclo, "nombre")}
                          title="Editar nombre"
                          aria-label="Editar nombre"
                          disabled={isCicloInUse(ciclo)}
                          className={[
                            "mt-1.5 inline-flex h-4 w-4 items-center justify-center rounded-md border text-[0.46rem] transition-colors",
                            isCicloInUse(ciclo)
                              ? "cursor-not-allowed border-border bg-surface text-text-light opacity-55"
                              : "border-border bg-surface2 text-text-mid hover:bg-[#e5d7d0] hover:text-navy",
                          ].join(" ")}
                        >
                          {"\u270F\uFE0F"}
                        </button>
                        <span className="font-medium text-navy">{ciclo.nombre}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingField?.id === ciclo.id &&
                    editingField.field === "codigo" ? (
                      <div className="flex items-center gap-2">
                        <input
                          className={INPUT_CLS}
                          value={editingField.value}
                          onChange={(e) =>
                            setEditingField((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    value: e.target.value
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9-]/g, ""),
                                  }
                                : prev
                            )
                          }
                          maxLength={20}
                          autoFocus
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={saveInlineEdit}
                          disabled={savingCycle}
                        >
                          {savingCycle ? "..." : "OK"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={closeInlineEdit}
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <button
                          type="button"
                          onClick={() => openInlineEdit(ciclo, "codigo")}
                          title="Editar código"
                          aria-label="Editar código"
                          disabled={isCicloInUse(ciclo)}
                          className={[
                            "mt-1.5 inline-flex h-4 w-4 items-center justify-center rounded-md border text-[0.46rem] transition-colors",
                            isCicloInUse(ciclo)
                              ? "cursor-not-allowed border-border bg-surface text-text-light opacity-55"
                              : "border-border bg-surface2 text-text-mid hover:bg-[#e5d7d0] hover:text-navy",
                          ].join(" ")}
                        >
                          {"\u270F\uFE0F"}
                        </button>
                        <div className="pt-1">
                          {ciclo.codigo ? (
                            <Badge variant={CICLO_BADGE[ciclo.codigo] ?? "gray"}>
                              {ciclo.codigo}
                            </Badge>
                          ) : (
                            <span className="text-text-light">-</span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-text-mid">
                    {formatDate(ciclo.updatedAt)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={
                          ciclo.activo ? "Desactivar ciclo" : "Activar ciclo"
                        }
                        title={ciclo.activo ? "Desactivar" : "Activar"}
                        onClick={() => handleToggleActivo(ciclo)}
                        className={[
                          "relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200",
                          ciclo.activo ? "bg-accent" : "bg-[#d7c7c3]",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                            ciclo.activo ? "translate-x-5" : "translate-x-1",
                          ].join(" ")}
                        />
                      </button>
                      <span className="min-w-[92px] text-left text-[0.82rem] font-medium text-text-mid">
                        {ciclo.activo ? "Activado" : "Desactivado"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(ciclo)}
                        title={
                          isCicloInUse(ciclo)
                            ? "No se puede eliminar porque el ciclo está en uso."
                            : "Eliminar ciclo"
                        }
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              <tr className="border-y border-border bg-[#f3e7da] hover:bg-[#f3e7da]">
                <td className="px-6 py-4 align-middle">
                  <input
                    className={INPUT_CLS}
                    value={createForm.nombre}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    placeholder="Nuevo ciclo formativo"
                    maxLength={120}
                  />
                </td>
                <td className="px-6 py-4 align-middle">
                  <input
                    className={INPUT_CLS}
                    value={createForm.codigo}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        codigo: e.target.value
                          .toUpperCase()
                          .replace(/[^A-Z0-9-]/g, ""),
                      }))
                    }
                    placeholder="Código"
                    maxLength={20}
                  />
                </td>
                <td className="px-6 py-4 text-text-light">Nuevo registro</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreate}
                      disabled={savingCycle}
                    >
                      {savingCycle ? "Guardando..." : "Guardar"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={resetCreateForm}
                    >
                      Limpiar
                    </Button>
                  </div>
                </td>
                <td className="px-6 py-4" />
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-border bg-surface px-6 py-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRestoreBase}
            disabled={restoring}
          >
            {restoring ? "Restaurando..." : "Restaurar ciclos iniciales"}
          </Button>
        </div>
      </Card>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex w-full flex-wrap items-center gap-3">
              <CardTitle icon="CA" iconVariant="amber">
                Cursos académicos &nbsp;&nbsp;&nbsp; (2024-2025, 2025-2026, ...)
              </CardTitle>
            </div>
          </CardHeader>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Mes de cambio de curso
              </span>
              <select
                className={INPUT_CLS}
                value={configuracionAcademica.mesCambioCurso}
                onChange={(e) =>
                  setConfiguracionAcademica((prev) => ({
                    ...prev,
                    mesCambioCurso: Number(e.target.value),
                  }))
                }
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Número de cursos visibles
              </span>
              <input
                className={INPUT_CLS}
                type="number"
                min={1}
                max={10}
                value={configuracionAcademica.numeroCursosVisibles}
                onChange={(e) =>
                  setConfiguracionAcademica((prev) => ({
                    ...prev,
                    numeroCursosVisibles: Number(e.target.value || 1),
                  }))
                }
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border bg-surface px-6 py-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRestoreConfiguracionAcademicaDefaults}
              disabled={savingAcademica}
            >
              Restaurar valores por defecto
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveConfiguracionAcademica}
              disabled={savingAcademica}
            >
              {savingAcademica ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex w-full flex-wrap items-center gap-3">
              <CardTitle icon="OA" iconVariant="blue">
                Otros ajustes
              </CardTitle>
            </div>
          </CardHeader>

          <div className="p-6">
            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Resultados por página
              </span>
              <input
                className={INPUT_CLS}
                type="number"
                min={1}
                max={100}
                value={configuracionAcademica.resultadosPorPagina}
                onChange={(e) =>
                  setConfiguracionAcademica((prev) => ({
                    ...prev,
                    resultadosPorPagina: Number(e.target.value || 1),
                  }))
                }
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-border bg-surface px-6 py-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRestoreResultadosPorPaginaDefault}
              disabled={savingAcademica}
            >
              Restaurar valores por defecto
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveConfiguracionAcademica}
              disabled={savingAcademica}
            >
              {savingAcademica ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
