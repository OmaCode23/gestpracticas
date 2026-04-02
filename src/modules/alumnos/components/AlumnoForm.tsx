"use client";

import {
  SectionLabel,
  Card,
  CardHeader,
  CardTitle,
  Tag,
  FormRow,
  FormGroup,
  Button,
  INPUT_CLS,
} from "@/components/ui";
import { ALUMNO_CV_MAX_BYTES, formatFileSize } from "@/modules/alumnos/utils/cv";

type FormState = {
  nombre: string;
  nia: string;
  nif: string;
  nuss: string;
  telefono: string;
  email: string;
  cicloFormativoId: string;
  cursoCiclo: string;
  curso: string;
};

type CvState = {
  existingName: string | null;
  existingSize: number | null;
  selectedFile: File | null;
  isMarkedForRemoval: boolean;
  error: string;
  isProcessing: boolean;
};

interface AlumnoFormProps {
  form: FormState;
  ciclos: { id: number; nombre: string; codigo: string | null }[];
  cursos: string[];
  onChange: (field: keyof FormState, value: string) => void;
  onGuardar: () => void;
  onActualizar: () => void;
  onCancelarEdicion: () => void;
  onToggleCollapse: () => void;
  isEditing: boolean;
  onLimpiar: () => void;
  cv: CvState;
  onCvSelect: (file: File | null) => void;
  onCvRemove: () => void;
}

export default function AlumnoForm({
  form,
  ciclos,
  cursos,
  onChange,
  onGuardar,
  onActualizar,
  onCancelarEdicion,
  onToggleCollapse,
  isEditing,
  onLimpiar,
  cv,
  onCvSelect,
  onCvRemove,
}: AlumnoFormProps) {
  const CURSO_CICLO_OPTIONS = [
    { value: "1", label: `1.\u00BA` },
    { value: "2", label: `2.\u00BA` },
  ];

  const sanitizeNombre = (value: string) =>
    value.replace(/[^\p{L}\s'.-]/gu, "").slice(0, 80);

  const sanitizeNia = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

  const sanitizeNif = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);

  const sanitizeNuss = (value: string) =>
    value.replace(/\D/g, "").slice(0, 12);

  const sanitizeTelefono = (value: string) =>
    value.replace(/\D/g, "").slice(0, 9);

  const sanitizeEmail = (value: string) =>
    value.trim().toLowerCase().slice(0, 120);

  const handleSubmit = () => {
    if (isEditing) onActualizar();
    else onGuardar();
  };

  const cvDisplayName =
    cv.selectedFile?.name ??
    (!cv.isMarkedForRemoval ? cv.existingName : null);

  const cvDisplaySize =
    cv.selectedFile?.size ??
    (!cv.isMarkedForRemoval ? cv.existingSize : null);

  return (
    <>
      <SectionLabel>Alta de alumno</SectionLabel>

      <Card className="mb-7">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={onToggleCollapse}
              aria-label="Colapsar formulario"
              title="Colapsar formulario"
              className="px-2.5 text-[0.95rem]"
            >
              {"\u25BE"}
            </Button>
            <CardTitle icon="AL" iconVariant="green">
              {isEditing ? "Editar alumno" : "Nuevo Alumno"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Tag>{isEditing ? "Modo edición" : "Formulario de alta"}</Tag>
          </div>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre completo *">
              <input
                className={INPUT_CLS}
                value={form.nombre}
                onChange={(e) => onChange("nombre", sanitizeNombre(e.target.value))}
                placeholder="Nombre y apellidos"
                maxLength={80}
              />
            </FormGroup>

            <FormGroup label="NIA *">
              <input
                className={INPUT_CLS}
                value={form.nia}
                onChange={(e) => onChange("nia", sanitizeNia(e.target.value))}
                placeholder="Número de identificación"
                maxLength={20}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="NIF">
              <input
                className={INPUT_CLS}
                value={form.nif}
                onChange={(e) => onChange("nif", sanitizeNif(e.target.value))}
                placeholder="12345678Z"
                maxLength={9}
              />
            </FormGroup>

            <FormGroup label="NUSS">
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={form.nuss}
                onChange={(e) => onChange("nuss", sanitizeNuss(e.target.value))}
                placeholder="123456789012"
                maxLength={12}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="Teléfono *">
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={form.telefono}
                onChange={(e) => onChange("telefono", sanitizeTelefono(e.target.value))}
                placeholder="600000000"
                maxLength={9}
              />
            </FormGroup>

            <FormGroup label="Correo electrónico *">
              <input
                className={INPUT_CLS}
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", sanitizeEmail(e.target.value))}
                placeholder="alumno@educa.gva.es"
                maxLength={120}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="Ciclo formativo *">
              <select
                className={INPUT_CLS}
                value={form.cicloFormativoId}
                onChange={(e) => onChange("cicloFormativoId", e.target.value)}
              >
                <option value="">Seleccionar ciclo</option>
                {ciclos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Curso ciclo *">
              <select
                className={INPUT_CLS}
                value={form.cursoCiclo}
                onChange={(e) => onChange("cursoCiclo", e.target.value)}
              >
                <option value="">Seleccionar curso ciclo</option>
                {CURSO_CICLO_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label="Curso académico *">
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={(e) => onChange("curso", e.target.value)}
              >
                <option value="">Seleccionar curso</option>
                {cursos.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label="CV del alumno">
              <label
                htmlFor="alumno-cv-input"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0] ?? null;
                  onCvSelect(file);
                }}
                className="flex min-h-[148px] cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-surface px-5 py-6 text-center transition-colors hover:border-blue-light hover:bg-surface2"
              >
                <input
                  id="alumno-cv-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(event) => onCvSelect(event.target.files?.[0] ?? null)}
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
                  {cv.isProcessing
                    ? "Preparando archivo..."
                    : cvDisplayName
                      ? `${cvDisplayName} (${formatFileSize(cvDisplaySize)})`
                      : "Sin archivo seleccionado"}
                </p>
                {cv.isMarkedForRemoval && cv.existingName && !cv.selectedFile ? (
                  <p className="mt-1 text-[0.78rem] text-amber-700">
                    El CV actual se eliminará al guardar.
                  </p>
                ) : null}
                {cv.error ? <p className="mt-1 text-[0.78rem] text-red-700">{cv.error}</p> : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {cvDisplayName || (cv.isMarkedForRemoval && cv.existingName) ? (
                    <Button variant="secondary" type="button" onClick={onCvRemove}>
                      {cv.isMarkedForRemoval && cv.existingName ? "Restaurar CV actual" : "Quitar CV"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </FormGroup>
          </FormRow>
        </div>

        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={isEditing ? onCancelarEdicion : onLimpiar}>
            {isEditing ? "Cancelar" : "Limpiar"}
          </Button>

          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? "Actualizar alumno" : "Guardar alumno"}
          </Button>
        </div>
      </Card>
    </>
  );
}
