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
import { FORMACION_FIELDS } from "@/modules/formacion/fields";
import type { FormacionInput } from "../types";

type EmpresaOption = { id: number; nombre: string };
type AlumnoOption = { id: number; nombre: string; nia: string };

interface FormacionFormProps {
  form: FormacionInput;
  saving: boolean;
  editingId: number | null;
  empresas: EmpresaOption[];
  alumnos: AlumnoOption[];
  cursos: string[];
  onChange: (key: keyof FormacionInput, value: string | number) => void;
  onClear: () => void;
  onSave: () => void;
}

const FIELD_BY_KEY = Object.fromEntries(
  FORMACION_FIELDS.map((field) => [field.key, field])
) as Record<string, (typeof FORMACION_FIELDS)[number]>;

export default function FormacionForm({
  form,
  saving,
  editingId,
  empresas,
  alumnos,
  cursos,
  onChange,
  onClear,
  onSave,
}: FormacionFormProps) {
  const sanitizeContacto = (value: string) =>
    value.replace(/\d/g, "").replace(/[^\p{L}\s'.-]/gu, "");

  return (
    <>
      <SectionLabel>Alta de formacion en empresa</SectionLabel>

      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="For" iconVariant="purple">
            {editingId !== null ? "Editar Formacion" : "Nueva Formacion"}
          </CardTitle>
          <Tag>{editingId !== null ? "Modo edicion" : "Formulario de alta"}</Tag>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label={`${FIELD_BY_KEY.empresa.formLabel} *`}>
              <select
                className={INPUT_CLS}
                value={form.empresaId || ""}
                onChange={(e) => onChange("empresaId", Number(e.target.value))}
              >
                <option value="">- Seleccionar empresa -</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label={`${FIELD_BY_KEY.alumno.formLabel} *`}>
              <select
                className={INPUT_CLS}
                value={form.alumnoId || ""}
                onChange={(e) => onChange("alumnoId", Number(e.target.value))}
              >
                <option value="">- Seleccionar alumno -</option>
                {alumnos.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.nombre} - {al.nia}
                  </option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label={`${FIELD_BY_KEY.curso.formLabel} *`}>
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={(e) => onChange("curso", e.target.value)}
              >
                <option value="">- Seleccionar curso -</option>
                {cursos.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label={`${FIELD_BY_KEY.periodo.formLabel} *`}>
              <input
                className={INPUT_CLS}
                value={form.periodo}
                onChange={(e) => onChange("periodo", e.target.value)}
                placeholder={FIELD_BY_KEY.periodo.placeholder}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label={FIELD_BY_KEY.descripcion.formLabel ?? "Descripcion"}>
              <textarea
                className={`${INPUT_CLS} h-28 resize-none`}
                value={form.descripcion ?? ""}
                onChange={(e) => onChange("descripcion", e.target.value)}
                placeholder={FIELD_BY_KEY.descripcion.placeholder}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label={FIELD_BY_KEY.contacto.formLabel ?? "Contacto"}>
              <input
                className={INPUT_CLS}
                value={form.contacto ?? ""}
                onChange={(e) => onChange("contacto", sanitizeContacto(e.target.value))}
                placeholder={FIELD_BY_KEY.contacto.placeholder}
              />
            </FormGroup>
          </FormRow>
        </div>

        <div className="flex justify-end gap-2.5 px-6 pb-6">
          <Button variant="secondary" onClick={onClear}>
            Limpiar
          </Button>

          <Button variant="primary" onClick={onSave}>
            {saving
              ? "Guardando..."
              : editingId !== null
                ? "Guardar cambios"
                : "Guardar formacion"}
          </Button>
        </div>
      </Card>
    </>
  );
}
