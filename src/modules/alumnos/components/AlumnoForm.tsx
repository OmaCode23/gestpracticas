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
import { CICLOS, CURSOS } from "@/shared/catalogs/academico";
import { ALUMNO_FIELDS } from "@/modules/alumnos/fields";

type FormState = {
  nombre: string;
  nia: string;
  telefono: string;
  email: string;
  ciclo: string;
  curso: string;
};

interface AlumnoFormProps {
  form: FormState;
  onChange: (field: keyof FormState, value: string) => void;
  onGuardar: () => void;
  onActualizar: () => void;
  onCancelarEdicion: () => void;
  isEditing: boolean;
  onLimpiar: () => void;
}

const FIELD_BY_KEY = Object.fromEntries(
  ALUMNO_FIELDS.map((field) => [field.key, field])
) as Record<string, (typeof ALUMNO_FIELDS)[number]>;

export default function AlumnoForm({
  form,
  onChange,
  onGuardar,
  onActualizar,
  onCancelarEdicion,
  isEditing,
  onLimpiar,
}: AlumnoFormProps) {
  const sanitizeNombre = (value: string) =>
    value.replace(/[^\p{L}\s'.-]/gu, "").slice(0, 80);

  const sanitizeNia = (value: string) =>
    value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);

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
          <CardTitle icon="Est" iconVariant="green">
            {isEditing ? "Editar alumno" : "Nuevo Alumno"}
          </CardTitle>
          <Tag>{isEditing ? "Modo edicion" : "Formulario de alta"}</Tag>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label={`${FIELD_BY_KEY.nombre.formLabel} *`}>
              <input
                className={INPUT_CLS}
                value={form.nombre}
                onChange={(e) => onChange("nombre", sanitizeNombre(e.target.value))}
                placeholder={FIELD_BY_KEY.nombre.placeholder}
                maxLength={80}
              />
            </FormGroup>

            <FormGroup label={`${FIELD_BY_KEY.nia.formLabel} *`}>
              <input
                className={INPUT_CLS}
                value={form.nia}
                onChange={(e) => onChange("nia", sanitizeNia(e.target.value))}
                placeholder={FIELD_BY_KEY.nia.placeholder}
                maxLength={20}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label={`${FIELD_BY_KEY.telefono.formLabel} *`}>
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={form.telefono}
                onChange={(e) => onChange("telefono", sanitizeTelefono(e.target.value))}
                placeholder={FIELD_BY_KEY.telefono.placeholder}
                maxLength={9}
              />
            </FormGroup>

            <FormGroup label={`${FIELD_BY_KEY.email.formLabel} *`}>
              <input
                className={INPUT_CLS}
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", sanitizeEmail(e.target.value))}
                placeholder={FIELD_BY_KEY.email.placeholder}
                maxLength={120}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label={`${FIELD_BY_KEY.ciclo.formLabel} *`}>
              <select
                className={INPUT_CLS}
                value={form.ciclo}
                onChange={(e) => onChange("ciclo", e.target.value)}
              >
                <option value="">- Seleccionar ciclo -</option>
                {CICLOS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label={`${FIELD_BY_KEY.curso.formLabel} *`}>
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={(e) => onChange("curso", e.target.value)}
              >
                <option value="">- Seleccionar curso -</option>
                {CURSOS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>
        </div>

        <div className="flex justify-end gap-2.5 px-6 pb-6">
          {isEditing && (
            <Button variant="secondary" onClick={onCancelarEdicion}>
              Cancelar edicion
            </Button>
          )}

          <Button variant="secondary" onClick={onLimpiar}>
            Limpiar
          </Button>

          <Button variant="primary" onClick={handleSubmit}>
            {isEditing ? "Guardar cambios" : "Guardar alumno"}
          </Button>
        </div>
      </Card>
    </>
  );
}
