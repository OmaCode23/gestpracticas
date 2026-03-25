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

type EmpresaOption = { id: number; nombre: string };
type AlumnoOption = { id: number; nombre: string; nia: string };

type FormacionFormProps = {
  form: {
    empresaId: number;
    alumnoId: number;
    curso: string;
    periodo: string;
    descripcion?: string;
    contacto?: string;
  };
  saving: boolean;
  editingId: number | null;
  empresas: EmpresaOption[];
  alumnos: AlumnoOption[];
  cursos: string[];
  onChange: (key: keyof FormacionFormProps["form"], value: any) => void;
  onClear: () => void;
  onSave: () => void;
};

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
      <SectionLabel>Alta de formación en empresa</SectionLabel>

      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="🏭" iconVariant="purple">
            {editingId !== null ? "Editar Formación" : "Nueva Formación"}
          </CardTitle>
          <Tag>
            {editingId !== null ? "✏️ Modo edición" : "📝 Formulario de alta"}
          </Tag>
        </CardHeader>

        <div className="p-6">
          {/* Empresa + Alumno */}
          <FormRow cols={2}>
            <FormGroup label="Empresa *">
              <select
                className={INPUT_CLS}
                value={form.empresaId || ""}
                onChange={(e) => onChange("empresaId", Number(e.target.value))}
              >
                <option value="">— Seleccionar empresa —</option>
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre}
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Alumno *">
              <select
                className={INPUT_CLS}
                value={form.alumnoId || ""}
                onChange={(e) => onChange("alumnoId", Number(e.target.value))}
              >
                <option value="">— Seleccionar alumno —</option>
                {alumnos.map((al) => (
                  <option key={al.id} value={al.id}>
                    {al.nombre} — {al.nia}
                  </option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          {/* Curso + Periodo */}
          <FormRow cols={2}>
            <FormGroup label="Curso académico *">
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={(e) => onChange("curso", e.target.value)}
              >
                <option value="">— Seleccionar curso —</option>
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

          {/* Descripción */}
          <FormRow cols={1}>
            <FormGroup label="Descripción">
              <textarea
                className={`${INPUT_CLS} h-28 resize-none`}
                value={form.descripcion}
                onChange={(e) => onChange("descripcion", e.target.value)}
                placeholder="Descripción de la formación..."
              />
            </FormGroup>
          </FormRow>

          {/* Contacto */}
          <FormRow cols={1}>
            <FormGroup label="Persona de contacto">
              <input
                className={INPUT_CLS}
                value={form.contacto}
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
            ✕ Limpiar
          </Button>

          <Button variant="primary" onClick={onSave}>
            {saving
              ? "Guardando..."
              : editingId !== null
              ? "✓ Guardar cambios"
              : "✓ Guardar formación"}
          </Button>
        </div>
      </Card>
    </>
  );
}


