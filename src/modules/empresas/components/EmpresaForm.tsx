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
import type { EmpresaInput } from "../types";
import LocalidadCombobox from "./LocalidadCombobox";

type EmpresaFormProps = {
  form: EmpresaInput;
  saving: boolean;
  editingId: number | null;
  ciclosFormativos: string[];
  localidades: string[];
  sectores: string[];
  onChange: (key: keyof EmpresaInput, value: string) => void;
  onClear: () => void;
  onSave: () => void;
};

export default function EmpresaForm({
  form,
  saving,
  editingId,
  ciclosFormativos,
  localidades,
  sectores,
  onChange,
  onClear,
  onSave,
}: EmpresaFormProps) {
  const sanitizeContacto = (value: string) =>
    value.replace(/\d/g, "").replace(/[^\p{L}\s'.-]/gu, "");

  const handleTelefonoChange = (value: string) => {
    const telefonoNormalizado = value.replace(/\D/g, "").slice(0, 9);
    onChange("telefono", telefonoNormalizado);
  };

  const handleCifChange = (value: string) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 9);
    onChange("cif", normalized);
  };

  const insertEmailToken = (field: "email" | "emailContacto", token: string) => {
    const currentValue = form[field] ?? "";

    if (currentValue.includes(token)) return;

    onChange(field, `${currentValue}${token}`);
  };

  const handleNombreChange = (value: string) => {
    onChange("nombre", value.slice(0, 80));
  };

  const handleContactoChange = (value: string) => {
    onChange("contacto", sanitizeContacto(value).slice(0, 80));
  };

  return (
    <>
      <SectionLabel>Alta de empresa</SectionLabel>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="🏢" iconVariant="blue">
            {editingId !== null ? "Editar Empresa" : "Nueva Empresa"}
          </CardTitle>
          <Tag>
            {editingId !== null ? "✏️ Modo edición" : "📝 Formulario de alta"}
          </Tag>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre de la empresa *">
              <input
                className={INPUT_CLS}
                maxLength={80}
                value={form.nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Tecnologías Mediterráneo S.L."
              />
            </FormGroup>

            <FormGroup label="CIF *">
              <input
                className={INPUT_CLS}
                maxLength={9}
                value={form.cif}
                onChange={(e) => handleCifChange(e.target.value)}
                placeholder="Ej: B12345678"
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="Dirección">
              <input
                className={INPUT_CLS}
                value={form.direccion}
                onChange={(e) => onChange("direccion", e.target.value)}
                placeholder="Calle, número, piso..."
              />
            </FormGroup>

            <FormGroup label="Localidad *">
              <LocalidadCombobox
                localidades={localidades}
                size="form"
                value={form.localidad}
                onChange={(value) => onChange("localidad", value)}
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={3}>
            <FormGroup label="Teléfono">
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                maxLength={9}
                value={form.telefono}
                onChange={(e) => handleTelefonoChange(e.target.value)}
                placeholder="963000000"
              />
            </FormGroup>

            <FormGroup label="Sector *">
              <select
                className={INPUT_CLS}
                value={form.sector}
                onChange={(e) => onChange("sector", e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {sectores.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Ciclo formativo">
              <select
                className={INPUT_CLS}
                value={form.cicloFormativo}
                onChange={(e) => onChange("cicloFormativo", e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {ciclosFormativos.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={3}>
            <FormGroup label="Persona de contacto">
              <input
                className={INPUT_CLS}
                value={form.contacto}
                onChange={(e) => handleContactoChange(e.target.value)}
                placeholder="Nombre y apellidos"
              />
            </FormGroup>

            <FormGroup label="Correo empresa">
              <div className="flex gap-2">
                <input
                  className={INPUT_CLS}
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="contacto@empresa.com"
                />
                <button
                  type="button"
                  onClick={() => insertEmailToken("email", "@")}
                  className="shrink-0 rounded-lg border border-border bg-surface2 px-3 text-[0.9rem] font-semibold text-text-mid transition-colors hover:border-blue-light hover:bg-white hover:text-navy"
                  title="Insertar @"
                >
                  @
                </button>
              </div>
            </FormGroup>

            <FormGroup label="Correo contacto">
              <div className="flex gap-2">
                <input
                  className={INPUT_CLS}
                  type="email"
                  value={form.emailContacto}
                  onChange={(e) => onChange("emailContacto", e.target.value)}
                  placeholder="responsable@empresa.com"
                />
                <button
                  type="button"
                  onClick={() => insertEmailToken("emailContacto", "@")}
                  className="shrink-0 rounded-lg border border-border bg-surface2 px-3 text-[0.9rem] font-semibold text-text-mid transition-colors hover:border-blue-light hover:bg-white hover:text-navy"
                  title="Insertar @"
                >
                  @
                </button>
              </div>
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
                : "✓ Guardar empresa"}
          </Button>
        </div>
      </Card>
    </>
  );
}
