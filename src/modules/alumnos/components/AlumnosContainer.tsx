"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import AlumnoForm from "./AlumnoForm";
import AlumnosTable from "./AlumnosTable";
import type { Alumno } from "@/modules/alumnos/types";
import SuccessToast from "@/components/ui/SuccessToast";
import { prepareAlumnoCvFile } from "@/modules/alumnos/utils/cv";
import {
  DEFAULT_RESULTADOS_POR_PAGINA,
  getCursosAcademicos,
} from "@/shared/catalogs/academico";
import type { ApiResponse } from "@/shared/types/api";
import { alumnoCrudSchema } from "@/modules/alumnos/types/schema";

const EMPTY = {
  nombre: "",
  nia: "",
  nif: "",
  nuss: "",
  telefono: "",
  email: "",
  cicloFormativoId: "",
  cursoCiclo: "",
  curso: "",
};

const EMPTY_CV = {
  existingName: null as string | null,
  existingSize: null as number | null,
  selectedFile: null as File | null,
  isMarkedForRemoval: false,
  error: "",
  isProcessing: false,
};

export default function AlumnosContainer({
  ciclosFormativos,
  cursos,
  resultadosPorPagina = DEFAULT_RESULTADOS_POR_PAGINA,
}: {
  ciclosFormativos: { id: number; nombre: string; codigo: string | null }[];
  cursos: string[];
  resultadosPorPagina?: number;
}) {
  const router = useRouter();
  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLDivElement | null>(null);
  const formatCursoCiclo = (value: number) => `${value}.\u00BA`;

  const [form, setForm] = useState(EMPTY);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [total, setTotal] = useState(0);
  const [formCiclos, setFormCiclos] = useState(ciclosFormativos);

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
  const [cvState, setCvState] = useState(EMPTY_CV);
  const [bulkCvBusy, setBulkCvBusy] = useState<"download" | "delete" | null>(null);

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
    setFormCiclos(ciclosFormativos);
    setCvState(EMPTY_CV);
    setIsFormExpanded(true);
    requestAnimationFrame(scrollToForm);
  };

  const collapseForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setFormCiclos(ciclosFormativos);
    setCvState(EMPTY_CV);
    setIsFormExpanded(false);
  };

  useEffect(() => {
    setFormCiclos((current) => {
      const currentInactive = current.filter(
        (ciclo) => !ciclosFormativos.some((activeCiclo) => activeCiclo.id === ciclo.id)
      );
      return [...ciclosFormativos, ...currentInactive];
    });
  }, [ciclosFormativos]);

  const handleCvSelect = async (file: File | null) => {
    if (!file) return;

    setCvState((current) => ({
      ...current,
      error: "",
      isProcessing: true,
    }));

    try {
      const preparedFile = await prepareAlumnoCvFile(file);
      setCvState((current) => ({
        ...current,
        selectedFile: preparedFile,
        isMarkedForRemoval: false,
        error: "",
        isProcessing: false,
      }));
    } catch (error) {
      setCvState((current) => ({
        ...current,
        selectedFile: null,
        error: error instanceof Error ? error.message : "No se pudo preparar el CV.",
        isProcessing: false,
      }));
    }
  };

  const handleCvRemove = () => {
    setCvState((current) => ({
      ...current,
      selectedFile: current.isMarkedForRemoval ? null : null,
      isMarkedForRemoval: current.existingName ? !current.isMarkedForRemoval : false,
      error: "",
      isProcessing: false,
    }));
  };

  async function syncAlumnoCv(alumnoId: number) {
    if (cvState.selectedFile) {
      const formData = new FormData();
      formData.append("file", cvState.selectedFile);

      const response = await fetch(`/api/alumnos/${alumnoId}/cv`, {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error);
      }
      return;
    }

    if (cvState.isMarkedForRemoval && cvState.existingName) {
      const response = await fetch(`/api/alumnos/${alumnoId}/cv`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error);
      }
    }
  }

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
      params.set("perPage", String(resultadosPorPagina));

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

  const getCursosAcademicosActuales = async () => {
    const response = await fetch("/api/settings/academico", {
      cache: "no-store",
    });
    const json: ApiResponse<{
      mesCambioCurso: number;
      numeroCursosVisibles: number;
      resultadosPorPagina: number;
    }> = await response.json();

    if (!json.ok) {
      throw new Error(json.error);
    }

    return getCursosAcademicos(
      json.data.numeroCursosVisibles,
      new Date(),
      json.data.mesCambioCurso
    );
  };

  // Guardar
  const handleGuardar = async () => {
    if (
      !form.nombre ||
      !form.nia ||
      !form.telefono ||
      !form.email ||
      !form.cicloFormativoId ||
      !form.cursoCiclo ||
      !form.curso
    ) {
      return alert(
        "Rellena todos los campos obligatorios: nombre, NIA, teléfono, correo, ciclo, curso ciclo y curso."
      );
    }

    const parsed = alumnoCrudSchema.safeParse(form);
    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    const cursosActuales = await getCursosAcademicosActuales();
    if (!cursosActuales.includes(form.curso)) {
      alert(
        "El curso seleccionado ya no es valido con la configuracion academica actual. Se recargara la pagina."
      );
      router.refresh();
      return;
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

      let uploadMessage = "Alumno creado correctamente.";
      try {
        await syncAlumnoCv(json.data.id);
        if (cvState.selectedFile) {
          uploadMessage = "Alumno y CV guardados correctamente.";
        }
      } catch (syncError) {
        uploadMessage =
          syncError instanceof Error
            ? `Alumno creado, pero el CV no se pudo guardar: ${syncError.message}`
            : "Alumno creado, pero el CV no se pudo guardar.";
      }
      setForm(EMPTY);
      setCvState(EMPTY_CV);
      setIsFormExpanded(false);
      await reloadToFirstPage();
      scrollToTable();
      router.refresh();

      setNotification(uploadMessage);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo crear el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // Actualizar
  const handleActualizar = async () => {
    if (!editingId) return;

    const parsed = alumnoCrudSchema.safeParse(form);
    if (!parsed.success) {
      alert(parsed.error.errors[0].message);
      return;
    }

    const cursosActuales = await getCursosAcademicosActuales();
    if (!cursosActuales.includes(form.curso)) {
      alert(
        "El curso seleccionado ya no es valido con la configuracion academica actual. Se recargara la pagina."
      );
      router.refresh();
      return;
    }

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

      let uploadMessage = "Alumno actualizado correctamente.";
      try {
        await syncAlumnoCv(editingId);
        if (cvState.selectedFile) {
          uploadMessage = "Alumno y CV actualizados correctamente.";
        } else if (cvState.isMarkedForRemoval && cvState.existingName) {
          uploadMessage = "Alumno actualizado y CV eliminado correctamente.";
        }
      } catch (syncError) {
        uploadMessage =
          syncError instanceof Error
            ? `Alumno actualizado, pero el CV no se pudo sincronizar: ${syncError.message}`
            : "Alumno actualizado, pero el CV no se pudo sincronizar.";
      }
      setEditingId(null);
      setForm(EMPTY);
      setCvState(EMPTY_CV);
      setIsFormExpanded(false);
      await load();
      scrollToTable();
      router.refresh();

      setNotification(uploadMessage);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudo actualizar el alumno.");
    } finally {
      setSaving(false);
    }
  };

  // Eliminar
  const handleEliminar = async (alumno: Alumno) => {
    const confirmationMessage = `¿Eliminar al alumno ${alumno.nombre} (NIA: ${alumno.nia})?`;
    if (!confirm(confirmationMessage)) return;

    try {
      const res = await fetch(`/api/alumnos/${alumno.id}`, {
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
    const cicloActualInactivo =
      alumno.cicloFormativoId &&
      alumno.cicloFormativoNombre &&
      !ciclosFormativos.some((ciclo) => ciclo.id === alumno.cicloFormativoId)
        ? [
            {
              id: alumno.cicloFormativoId,
              nombre: `${alumno.cicloFormativoNombre} (inactivo)`,
              codigo: alumno.cicloFormativoCodigo,
            },
          ]
        : [];

    setEditingId(alumno.id);
    setIsFormExpanded(true);
    setFormCiclos([...ciclosFormativos, ...cicloActualInactivo]);
    setForm({
      nombre: alumno.nombre,
      nia: alumno.nia,
      nif: alumno.nif ?? "",
      nuss: alumno.nuss ?? "",
      telefono: alumno.telefono ?? "",
      email: alumno.email ?? "",
      cicloFormativoId: alumno.cicloFormativoId ? String(alumno.cicloFormativoId) : "",
      cursoCiclo: String(alumno.cursoCiclo),
      curso: alumno.curso,
    });
    setCvState({
      existingName: alumno.cvNombre,
      existingSize: alumno.cvTamano,
      selectedFile: null,
      isMarkedForRemoval: false,
      error: "",
      isProcessing: false,
    });

    requestAnimationFrame(scrollToForm);
  };

  const handleCancelarEdicion = () => {
    collapseForm();
    scrollToTable();
  };

  const handleDownloadAllCv = async () => {
    try {
      setBulkCvBusy("download");

      const response = await fetch("/api/alumnos/cv", {
        cache: "no-store",
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error ?? "No se pudieron descargar los CVs.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const disposition = response.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="([^"]+)"/);
      link.href = url;
      link.download = fileNameMatch?.[1] ?? "cvs_alumnos.zip";
      link.click();
      window.URL.revokeObjectURL(url);

      setNotification("Descarga de CVs iniciada correctamente.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudieron descargar los CVs.");
    } finally {
      setBulkCvBusy(null);
    }
  };

  const handleDeleteAllCv = async () => {
    if (!confirm("Se eliminarán todos los CV adjuntos de los alumnos. ¿Quieres continuar?")) {
      return;
    }

    try {
      setBulkCvBusy("delete");

      const response = await fetch("/api/alumnos/cv", {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error ?? "No se pudieron eliminar los CVs.");
      }

      await load();
      router.refresh();

      setNotification(
        json.data.deletedCount > 0
          ? `Se eliminaron ${json.data.deletedCount} CV(s) correctamente.`
          : "No había CV adjuntos para eliminar."
      );
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "No se pudieron eliminar los CVs.");
    } finally {
      setBulkCvBusy(null);
    }
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
          ciclos={ciclosFormativos}
          cursos={cursos}
          total={total}
          perPage={resultadosPorPagina}
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
          onDownloadAllCv={handleDownloadAllCv}
          onDeleteAllCv={handleDeleteAllCv}
          bulkCvBusy={bulkCvBusy}
        />
      </div>

      <div ref={formSectionRef} className="mt-10">
        {isFormExpanded ? (
          <AlumnoForm
            form={form}
            ciclos={formCiclos}
            cursos={cursos}
            onChange={setFormField}
            onGuardar={handleGuardar}
            onActualizar={handleActualizar}
            onCancelarEdicion={handleCancelarEdicion}
            onToggleCollapse={handleCancelarEdicion}
            isEditing={editingId !== null}
            onLimpiar={() => {
              setForm(EMPTY);
              setCvState(EMPTY_CV);
            }}
            cv={cvState}
            onCvSelect={handleCvSelect}
            onCvRemove={handleCvRemove}
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
                <Button variant="primary" onClick={openNewForm}>
                  Nueva alta
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedAlumno ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c20]/45 p-4"
          onClick={() => setSelectedAlumno(null)}
        >
          <div
            className="w-full max-w-4xl rounded-[24px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(43,28,32,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
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
                <p className="mt-1 font-medium text-navy">
                  {selectedAlumno.cicloFormativoNombre ?? "-"}
                </p>
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
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Teléfono</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.telefono ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3 sm:col-span-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">Correo</p>
                <p className="mt-1 font-medium text-navy">{selectedAlumno.email ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface px-4 py-3 sm:col-span-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-text-light">CV</p>
                {selectedAlumno.cvNombre ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <p className="font-medium text-navy">
                      {selectedAlumno.cvNombre}
                      {selectedAlumno.cvTamano ? ` (${Math.round(selectedAlumno.cvTamano / 1024)} KB)` : ""}
                    </p>
                    <a
                      href={`/api/alumnos/${selectedAlumno.id}/cv`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[10px] border border-border bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-navy transition-colors hover:bg-surface2"
                    >
                      Ver o descargar CV
                    </a>
                  </div>
                ) : (
                  <p className="mt-1 font-medium text-navy">Sin CV adjunto</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
