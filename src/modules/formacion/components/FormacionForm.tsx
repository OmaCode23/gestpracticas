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
import type { FormacionInput } from "../types";

type EmpresaOption = { id: number; nombre: string };
type AlumnoOption = {
  id: number;
  nombre: string;
  nia: string;
  nif: string | null;
  nuss: string | null;
};

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
          <CardTitle icon="FE" iconVariant="purple">
            {editingId !== null ? "Editar formacion" : "Nueva formacion"}
          </CardTitle>
          <Tag>{editingId !== null ? "Modo edicion" : "Formulario de alta"}</Tag>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Alumno *">
              <select
                className={INPUT_CLS}
                value={form.alumnoId || ""}
                onChange={(e) => onChange("alumnoId", Number(e.target.value))}
              >
                <option value="">Seleccionar alumno</option>
                {alumnos.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.nombre} - NIA: {al.nia}
                    {al.nif ? ` - NIF: ${al.nif}` : ""}
                    {al.nuss ? ` - NUSS: ${al.nuss}` : ""}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Empresa *">
              <select
                className={INPUT_CLS}
                value={form.empresaId || ""}
                onChange={(e) => onChange("empresaId", Number(e.target.value))}
              >
                <option value="">Seleccionar empresa</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="Curso academico *">
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

            <FormGroup label="Periodo *">
              <input
                className={INPUT_CLS}
                value={form.periodo}
                onChange={(e) => onChange("periodo", e.target.value)}
                placeholder="Ej: Marzo - Junio"
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label="Descripcion">
              <textarea
                className={`${INPUT_CLS} h-28 resize-none`}
                value={form.descripcion ?? ""}
                onChange={(e) => onChange("descripcion", e.target.value)}
                placeholder="Descripcion de la formacion..."
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={1}>
            <FormGroup label="Persona de contacto">
              <input
                className={INPUT_CLS}
                value={form.contacto ?? ""}
                onChange={(e) =>
                  onChange("contacto", sanitizeContacto(e.target.value))
                }
                placeholder="Nombre y apellidos"
              />
            </FormGroup>
          </FormRow>
        </div>

        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={onClear}>
            {editingId !== null ? "Cancelar" : "Limpiar"}
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
