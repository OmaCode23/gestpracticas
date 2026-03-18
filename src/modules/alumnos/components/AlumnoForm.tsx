/**
 * modules/alumnos/components/AlumnoForm.tsx  —  Client Component
 */

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
import { CICLOS, CURSOS } from "@/shared/mockData";

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
  const handleSubmit = () => {
    if (isEditing) onActualizar();
    else onGuardar();
  };

  return (
    <>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="👩‍🎓" iconVariant="green">
            {isEditing ? "Editar alumno" : "Nuevo Alumno"}
          </CardTitle>
          <Tag>📝 Formulario de alta</Tag>
        </CardHeader>
        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre completo *">
              <input
                className={INPUT_CLS}
                value={form.nombre}
                onChange={e => onChange("nombre", e.target.value)}
                placeholder="Nombre y apellidos"
              />
            </FormGroup>
            <FormGroup label="NIA *">
              <input
                className={INPUT_CLS}
                value={form.nia}
                onChange={e => onChange("nia", e.target.value)}
                placeholder="Número de identificación"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Teléfono *">
              <input
                className={INPUT_CLS}
                value={form.telefono}
                onChange={e => onChange("telefono", e.target.value)}
                placeholder="6XX XXX XXX"
              />
            </FormGroup>
            <FormGroup label="Correo electrónico *">
              <input
                className={INPUT_CLS}
                type="email"
                value={form.email}
                onChange={e => onChange("email", e.target.value)}
                placeholder="alumno@educa.gva.es"
              />
            </FormGroup>
          </FormRow>
          <FormRow cols={2}>
            <FormGroup label="Ciclo formativo *">
              <select
                className={INPUT_CLS}
                value={form.ciclo}
                onChange={e => onChange("ciclo", e.target.value)}
              >
                <option value="">— Seleccionar ciclo —</option>
                {CICLOS.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>
            <FormGroup label="Curso académico *">
              <select
                className={INPUT_CLS}
                value={form.curso}
                onChange={e => onChange("curso", e.target.value)}
              >
                <option value="">— Seleccionar curso —</option>
                {CURSOS.map(c => (
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
    </>
  );
}
