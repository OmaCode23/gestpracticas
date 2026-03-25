"use client";

import {
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
    <Card className="mb-7">
      <CardHeader>
        <CardTitle icon="👩‍🎓" iconVariant="green">
          {isEditing ? "Editar alumno" : "Nuevo Alumno"}
        </CardTitle>
        <Tag>{isEditing ? "✏️ Modo edición" : "📝 Formulario de alta"}</Tag>
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
              value={form.ciclo}
              onChange={(e) => onChange("ciclo", e.target.value)}
            >
              <option value="">— Seleccionar ciclo —</option>
              {CICLOS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Curso académico *">
            <select
              className={INPUT_CLS}
              value={form.curso}
              onChange={(e) => onChange("curso", e.target.value)}
            >
              <option value="">— Seleccionar curso —</option>
              {CURSOS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </FormGroup>
        </FormRow>
      </div>

      <div className="px-6 pb-6 flex gap-2.5 justify-end">
        {isEditing && (
          <Button variant="secondary" onClick={onCancelarEdicion}>
            Cancelar edición
          </Button>
        )}

        <Button variant="secondary" onClick={onLimpiar}>
          ✕ Limpiar
        </Button>

        <Button variant="primary" onClick={handleSubmit}>
          {isEditing ? "✓ Actualizar alumno" : "✓ Guardar alumno"}
        </Button>
      </div>
    </Card>
  );
}
