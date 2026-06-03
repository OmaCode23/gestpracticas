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
import { OFERTA_ESTADOS } from "../types/schema";

export type OfertaFormState = {
  titulo: string;
  empresaId: string;
  cicloFormativoId: string;
  plazas: string;
  requisitos: string;
  periodo: string;
  descripcion: string;
  estado: (typeof OFERTA_ESTADOS)[number];
};

type CicloFormativoOption = {
  id: number;
  nombre: string;
  codigo: string | null;
};

type EmpresaOption = {
  id: number;
  nombre: string;
};

type OfertaFormProps = {
  form: OfertaFormState;
  saving: boolean;
  editingId: number | null;
  empresas: EmpresaOption[];
  ciclosFormativos: CicloFormativoOption[];
  onChange: (key: keyof OfertaFormState, value: string) => void;
  onClear: () => void;
  onSave: () => void;
};

const ESTADO_LABELS: Record<(typeof OFERTA_ESTADOS)[number], string> = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  CERRADA: "Cerrada",
};

export default function OfertaForm({
  form,
  saving,
  editingId,
  empresas,
  ciclosFormativos,
  onChange,
  onClear,
  onSave,
}: OfertaFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle icon="Of" iconVariant="blue">
          {editingId !== null ? "Editar Oferta" : "Nueva Oferta"}
        </CardTitle>
        <Tag>{editingId !== null ? "Modo edicion" : "Formulario de alta"}</Tag>
      </CardHeader>

      <div className="p-6">
        <FormRow cols={2}>
          <FormGroup label="Titulo *">
            <input
              className={INPUT_CLS}
              maxLength={140}
              value={form.titulo}
              onChange={(e) => onChange("titulo", e.target.value)}
              placeholder="Prácticas de desarrollo web"
            />
          </FormGroup>

          <FormGroup label="Empresa *">
            <select
              className={INPUT_CLS}
              value={form.empresaId}
              onChange={(e) => onChange("empresaId", e.target.value)}
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nombre}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={3}>
          <FormGroup label="Ciclo formativo">
            <select
              className={INPUT_CLS}
              value={form.cicloFormativoId}
              onChange={(e) => onChange("cicloFormativoId", e.target.value)}
            >
              <option value="">Todos los ciclos</option>
              {ciclosFormativos.map((ciclo) => (
                <option key={ciclo.id} value={ciclo.id}>
                  {ciclo.codigo ? `${ciclo.codigo} - ${ciclo.nombre}` : ciclo.nombre}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Plazas *">
            <input
              className={INPUT_CLS}
              inputMode="numeric"
              min={1}
              max={100}
              type="number"
              value={form.plazas}
              onChange={(e) => onChange("plazas", e.target.value)}
              placeholder="1"
            />
          </FormGroup>

          <FormGroup label="Estado">
            <select
              className={INPUT_CLS}
              value={form.estado}
              onChange={(e) => onChange("estado", e.target.value)}
            >
              {OFERTA_ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {ESTADO_LABELS[estado]}
                </option>
              ))}
            </select>
          </FormGroup>
        </FormRow>

        <FormRow cols={2}>
          <FormGroup label="Periodo">
            <input
              className={INPUT_CLS}
              maxLength={100}
              value={form.periodo}
              onChange={(e) => onChange("periodo", e.target.value)}
              placeholder="Abril - Junio"
            />
          </FormGroup>

          <FormGroup label="Requisitos">
            <input
              className={INPUT_CLS}
              maxLength={500}
              value={form.requisitos}
              onChange={(e) => onChange("requisitos", e.target.value)}
              placeholder="HTML, CSS, Git..."
            />
          </FormGroup>
        </FormRow>

        <FormRow cols={1}>
          <FormGroup label="Descripcion">
            <textarea
              className={`${INPUT_CLS} min-h-[120px] resize-y`}
              maxLength={700}
              value={form.descripcion}
              onChange={(e) => onChange("descripcion", e.target.value)}
              placeholder="Funciones principales, entorno de trabajo y aprendizaje previsto."
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
              : "Guardar oferta"}
        </Button>
      </div>
    </Card>
  );
}
