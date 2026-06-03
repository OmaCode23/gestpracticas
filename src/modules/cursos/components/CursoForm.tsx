"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  FormGroup,
  FormRow,
  INPUT_CLS,
  Tag,
} from "@/components/ui";

export type CursoFormState = {
  titulo: string;
  proveedorId: string;
  areaId: string;
  nivel: string;
  modalidad: string;
  duracion: string;
  descripcion: string;
  enlace: string;
  activo: boolean;
};

type CursoCatalogoOption = {
  id: number;
  nombre: string;
};

type CursoFormProps = {
  form: CursoFormState;
  saving: boolean;
  editingId: number | null;
  proveedores: CursoCatalogoOption[];
  areas: CursoCatalogoOption[];
  niveles: readonly string[];
  modalidades: readonly string[];
  onChange: (key: keyof CursoFormState, value: string | boolean) => void;
  onClear: () => void;
  onSave: () => void;
};

export default function CursoForm({
  form,
  saving,
  editingId,
  proveedores,
  areas,
  niveles,
  modalidades,
  onChange,
  onClear,
  onSave,
}: CursoFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle icon="Cur" iconVariant="amber">
          {editingId !== null ? "Editar Curso" : "Nuevo Curso"}
        </CardTitle>
        <Tag>{editingId !== null ? "Modo edicion" : "Formulario de alta"}</Tag>
      </CardHeader>

      <div className="p-6">
        <FormRow cols={2}>
          <FormGroup label="Titulo *">
            <input
              className={INPUT_CLS}
              maxLength={120}
              value={form.titulo}
              onChange={(e) => onChange("titulo", e.target.value)}
              placeholder="Redes y conectividad"
            />
          </FormGroup>

          <FormGroup label="Proveedor *">
            <select
              className={INPUT_CLS}
              value={form.proveedorId}
              onChange={(e) => onChange("proveedorId", e.target.value)}
            >
              <option value="">Seleccionar proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.id}>
                  {proveedor.nombre}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={3}>
          <FormGroup label="Area *">
            <select
              className={INPUT_CLS}
              value={form.areaId}
              onChange={(e) => onChange("areaId", e.target.value)}
            >
              <option value="">Seleccionar area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Nivel *">
            <select
              className={INPUT_CLS}
              value={form.nivel}
              onChange={(e) => onChange("nivel", e.target.value)}
            >
              <option value="">Seleccionar nivel</option>
              {niveles.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {nivel}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Modalidad *">
            <select
              className={INPUT_CLS}
              value={form.modalidad}
              onChange={(e) => onChange("modalidad", e.target.value)}
            >
              <option value="">Seleccionar modalidad</option>
              {modalidades.map((modalidad) => (
                <option key={modalidad} value={modalidad}>
                  {modalidad}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={3}>
          <FormGroup label="Duracion">
            <input
              className={INPUT_CLS}
              maxLength={60}
              value={form.duracion}
              onChange={(e) => onChange("duracion", e.target.value)}
              placeholder="Autoguiado"
            />
          </FormGroup>

          <FormGroup label="Enlace">
            <input
              className={INPUT_CLS}
              type="url"
              value={form.enlace}
              onChange={(e) => onChange("enlace", e.target.value)}
              placeholder="https://..."
            />
          </FormGroup>

          <FormGroup label="Estado">
            <select
              className={INPUT_CLS}
              value={form.activo ? "true" : "false"}
              onChange={(e) => onChange("activo", e.target.value === "true")}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={1}>
          <FormGroup label="Descripcion">
            <textarea
              className={`${INPUT_CLS} min-h-[110px] resize-y`}
              maxLength={500}
              value={form.descripcion}
              onChange={(e) => onChange("descripcion", e.target.value)}
              placeholder="Resumen breve del contenido y utilidad del curso."
            />
          </FormGroup>
        </FormRow>
      </div>

      <div className="flex justify-end gap-2.5 px-6 pb-6">
        <Button variant="secondary" onClick={onClear}>
          Limpiar
        </Button>

        <Button variant="primary" onClick={onSave} disabled={saving}>
          {saving
            ? "Guardando..."
            : editingId !== null
              ? "Guardar cambios"
              : "Guardar curso"}
        </Button>
      </div>
    </Card>
  );
}
