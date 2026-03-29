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
import { CICLOS_FORMATIVOS, CURSOS } from "@/shared/catalogs/academico";

type FormState = {
  nombre: string;
  nia: string;
  nif: string;
  nuss: string;
  telefono: string;
  email: string;
  ciclo: string;
  cursoCiclo: string;
  curso: string;
};

interface AlumnoFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onGuardar: () => void;
  onActualizar: () => void;
  onCancelarEdicion: () => void;
  onToggleCollapse: () => void;
  isEditing: boolean;
  onLimpiar: () => void;
}

export default function AlumnoForm({
  form,
  onChange,
  onGuardar,
  onActualizar,
  onCancelarEdicion,
  onToggleCollapse,
  isEditing,
  onLimpiar,
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
            <Tag>{isEditing ? "Modo edicion" : "Formulario de alta"}</Tag>
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
                placeholder="Numero de identificacion"
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
            <FormGroup label="Telefono *">
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={form.telefono}
                onChange={(e) => onChange("telefono", sanitizeTelefono(e.target.value))}
                placeholder="600000000"
                maxLength={9}
              />
            </FormGroup>

            <FormGroup label="Correo electronico *">
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
                value={form.ciclo}
                onChange={(e) => onChange("ciclo", e.target.value)}
              >
                <option value="">Seleccionar ciclo</option>
                {CICLOS_FORMATIVOS.map((c) => (
                  <option key={c}>{c}</option>
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
            <FormGroup label="Curso academico *">
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={(e) => onChange("curso", e.target.value)}
              >
                <option value="">Seleccionar curso</option>
                {CURSOS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
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
