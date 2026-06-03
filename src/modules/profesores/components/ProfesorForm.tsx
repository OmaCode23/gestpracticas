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
import { PROFESOR_FIELDS } from "@/modules/profesores/fields";
import type { ProfesorInput } from "../types";

type ProfesorFormState = Omit<ProfesorInput, "cicloFormativoId"> & {
  cicloFormativoId: string;
};

type ProfesorFormProps = {
  form: ProfesorFormState;
  saving: boolean;
  editingId: number | null;
  originalEmail: string | null;
  ciclosFormativos: Array<{ id: number; nombre: string }>;
  onChange: (key: keyof ProfesorFormState, value: string) => void;
  onClear: () => void;
  onSave: () => void;
};

const FIELD_BY_KEY = Object.fromEntries(
  PROFESOR_FIELDS.map((field) => [field.key, field])
) as Record<string, (typeof PROFESOR_FIELDS)[number]>;

export default function ProfesorForm({
  form,
  saving,
  editingId,
  originalEmail,
  ciclosFormativos,
  onChange,
  onClear,
  onSave,
}: ProfesorFormProps) {
  const handleNifChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
    onChange("nif", normalized);
  };

  const handleTelefonoChange = (value: string) => {
    onChange("telefono", value.replace(/\D/g, "").slice(0, 9));
  };

  const handleNombreChange = (value: string) => {
    onChange("nombre", value.replace(/\d/g, "").slice(0, 100));
  };

  const sanitizeEmail = (value: string) => value.trim().toLowerCase().slice(0, 120);

  const hasEmailChangedInEdition =
    editingId !== null &&
    originalEmail !== null &&
    sanitizeEmail(form.email) !== sanitizeEmail(originalEmail);

  const insertEmailAt = () => {
    const current = form.email ?? "";
    if (!current.includes("@")) onChange("email", `${current}@`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle icon="Pro" iconVariant="purple">
          {editingId !== null ? "Editar Profesor" : "Nuevo Profesor"}
        </CardTitle>
        <Tag>{editingId !== null ? "Modo edicion" : "Formulario de alta"}</Tag>
      </CardHeader>

      <div className="p-6">
        <FormRow cols={2}>
          <FormGroup label={`${FIELD_BY_KEY.nombre.formLabel} *`}>
            <input
              className={INPUT_CLS}
              maxLength={100}
              value={form.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder={FIELD_BY_KEY.nombre.placeholder}
            />
          </FormGroup>

          <FormGroup label={FIELD_BY_KEY.nif.formLabel ?? "NIF"}>
            <input
              className={INPUT_CLS}
              maxLength={9}
              value={form.nif}
              onChange={(e) => handleNifChange(e.target.value)}
              placeholder={FIELD_BY_KEY.nif.placeholder}
            />
          </FormGroup>
        </FormRow>

        <FormRow cols={2}>
          <FormGroup label={FIELD_BY_KEY.especialidad.formLabel ?? "Especialidad"}>
            <input
              className={INPUT_CLS}
              maxLength={100}
              value={form.especialidad}
              onChange={(e) => onChange("especialidad", e.target.value)}
              placeholder={FIELD_BY_KEY.especialidad.placeholder}
            />
          </FormGroup>

          <FormGroup label={FIELD_BY_KEY.cicloFormativo.formLabel ?? "Ciclo formativo"}>
            <select
              className={INPUT_CLS}
              value={form.cicloFormativoId}
              onChange={(e) => onChange("cicloFormativoId", e.target.value)}
            >
              <option value="">- Seleccionar -</option>
              {ciclosFormativos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={2}>
          <FormGroup label={FIELD_BY_KEY.telefono.formLabel ?? "Telefono"}>
            <input
              className={INPUT_CLS}
              inputMode="numeric"
              maxLength={9}
              value={form.telefono}
              onChange={(e) => handleTelefonoChange(e.target.value)}
              placeholder={FIELD_BY_KEY.telefono.placeholder}
            />
          </FormGroup>

          <FormGroup label={`${FIELD_BY_KEY.email.formLabel ?? "Correo electronico"} *`}>
            <div className="flex gap-2">
              <input
                className={INPUT_CLS}
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder={FIELD_BY_KEY.email.placeholder}
              />
              <button
                type="button"
                onClick={insertEmailAt}
                className="shrink-0 rounded-lg border border-border bg-surface2 px-3 text-[0.9rem] font-semibold text-text-mid transition-colors hover:border-blue-light hover:bg-white hover:text-navy"
                title="Insertar @"
              >
                @
              </button>
            </div>
            {hasEmailChangedInEdition ? (
              <p className="mt-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-[0.8rem] leading-relaxed text-amber-900">
                Al modificar este email, también cambiará el email con el que el profesor podrá acceder a la aplicación como usuario.
              </p>
            ) : null}
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
              : "Guardar profesor"}
        </Button>
      </div>
    </Card>
  );
}
