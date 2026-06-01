"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  ALUMNO_CV_MAX_BYTES,
  formatFileSize,
  prepareAlumnoCvFile,
} from "@/modules/alumnos/utils/cv";

type Props = {
  cvNombre: string | null;
  cvMimeType: string | null;
  cvTamano: number | null;
  cvUpdatedAt: string | null;
};

type Message = {
  type: "success" | "error";
  text: string;
} | null;

export default function PortalAlumnoCvManager({
  cvNombre,
  cvMimeType,
  cvTamano,
  cvUpdatedAt,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isMarkedForRemoval, setIsMarkedForRemoval] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<Message>(null);

  const cvDisplayName = selectedFile?.name ?? (!isMarkedForRemoval ? cvNombre : null);
  const cvDisplaySize = selectedFile?.size ?? (!isMarkedForRemoval ? cvTamano : null);
  const hasPendingUpload = !!selectedFile;

  function formatPortalDate(value: string | null) {
    if (!value) return "-";

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  async function handleCvSelect(file: File | null) {
    if (!file) return;

    setMessage(null);
    setError("");
    setIsProcessing(true);

    try {
      const preparedFile = await prepareAlumnoCvFile(file);
      setSelectedFile(preparedFile);
      setIsMarkedForRemoval(false);
    } catch (selectionError) {
      setSelectedFile(null);
      setError(
        selectionError instanceof Error ? selectionError.message : "No se pudo preparar el CV."
      );
    } finally {
      setIsProcessing(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleCvRemove() {
    setMessage(null);
    setError("");

    if (selectedFile) {
      setSelectedFile(null);
      return;
    }

    if (cvNombre) {
      const confirmed = window.confirm("El CV actual se eliminará");
      if (!confirmed) {
        return;
      }
      void handleDeleteCurrentCv();
    }
  }

  async function handleSave() {
    if (!selectedFile) {
      return;
    }

    setIsSaving(true);
    setMessage(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/portal-alumno/cv", {
        method: "POST",
        body: formData,
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error ?? "No se pudo guardar el CV.");
      }

      setMessage({ type: "success", text: "CV subido correctamente." });
      setSelectedFile(null);
      setIsMarkedForRemoval(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar el CV.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteCurrentCv() {
    setIsSaving(true);
    setMessage(null);
    setError("");

    try {
      const response = await fetch("/api/portal-alumno/cv", {
        method: "DELETE",
      });
      const json = await response.json();

      if (!json.ok) {
        throw new Error(json.error ?? "No se pudo eliminar el CV.");
      }

      setMessage({ type: "success", text: "CV eliminado correctamente." });
      setSelectedFile(null);
      setIsMarkedForRemoval(false);
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "No se pudo eliminar el CV.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="portal-alumno-cv-input"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0] ?? null;
          void handleCvSelect(file);
        }}
        className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-5 py-6 text-center transition-colors hover:border-blue-light hover:bg-surface2"
      >
        <input
          ref={inputRef}
          id="portal-alumno-cv-input"
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(event) => void handleCvSelect(event.target.files?.[0] ?? null)}
        />
        <p className="text-[0.92rem] font-semibold text-navy">
          Arrastra aquí el CV o pulsa para seleccionarlo
        </p>
        <p className="mt-2 text-[0.8rem] leading-relaxed text-text-mid">
          Formato admitido: PDF. Límite final: {formatFileSize(ALUMNO_CV_MAX_BYTES)}.
        </p>
        <p className="mt-1 text-[0.76rem] text-text-light">
          Si el fichero supera el límite, prepara una versión optimizada antes de subirla.
        </p>
      </label>

      <div className="mt-3 rounded-[14px] border border-border bg-white px-4 py-3">
        <p className="text-[0.76rem] font-semibold uppercase tracking-[0.06em] text-text-light">
          Estado del CV
        </p>
        <p className="mt-2 text-[0.84rem] text-navy">
          {isProcessing
            ? "Preparando archivo..."
            : cvDisplayName
              ? `${cvDisplayName} (${formatFileSize(cvDisplaySize)})`
              : "Sin archivo seleccionado"}
        </p>
        {!selectedFile && cvNombre && !isMarkedForRemoval ? (
          <div className="mt-2 grid gap-1 text-[0.78rem] text-text-mid">
            <p>
              <span className="font-semibold text-navy">Tipo:</span> {cvMimeType}
            </p>
            <p>
              <span className="font-semibold text-navy">Actualizado:</span> {formatPortalDate(cvUpdatedAt)}
            </p>
          </div>
        ) : null}
        {error ? <p className="mt-1 text-[0.78rem] text-red-700">{error}</p> : null}
        {message ? (
          <p
            className={`mt-1 text-[0.78rem] ${
              message.type === "success" ? "text-green-700" : "text-red-700"
            }`}
          >
            {message.text}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {cvNombre && !selectedFile ? (
            <a
              href="/api/portal-alumno/cv"
              className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white no-underline transition-colors hover:bg-[#851534]"
              target="_blank"
              rel="noreferrer"
            >
              Ver o descargar CV
            </a>
          ) : null}
          {selectedFile ? (
            <Button variant="secondary" type="button" onClick={handleCvRemove} disabled={isSaving}>
              Descartar
            </Button>
          ) : null}
          {!selectedFile && cvNombre ? (
            <Button variant="secondary" type="button" onClick={handleCvRemove} disabled={isSaving}>
              Quitar CV
            </Button>
          ) : null}
          {hasPendingUpload ? (
            <Button
              variant="primary"
              type="button"
              onClick={handleSave}
              disabled={isProcessing || isSaving}
            >
              {isSaving ? "Guardando..." : "Guardar CV"}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
