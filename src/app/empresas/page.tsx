"use client";

/**
 * app/empresas/page.tsx
 *
 * Página de gestión de empresas — datos mock, sin BD.
 * TODO: Conectar con la API real cuando esté lista.
 */

"use client";

import { useEffect, useState } from "react";
import {
  PageHeader, SectionLabel, Card, CardHeader, CardTitle, Tag,
  FormRow, FormGroup, Button, TableFilters, TdActions, Badge,
  INPUT_CLS, type BadgeVariant,
} from "@/components/ui";
import { SearchBox, FilterSelect } from "@/components/ui/Filters";
import Pagination from "@/components/ui/Pagination";
import { SECTORES, LOCALIDADES } from "@/shared/mockData";
import type { ApiResponse } from "@/shared/types/api";
import type { Empresa, PaginatedEmpresas, EmpresaInput } from "@/modules/empresas/types";

const SECTOR_BADGE: Record<string, BadgeVariant> = {
  "Informática / TIC": "blue",
  "Sanidad": "green",
  "Hostelería / Turismo": "amber",
  "Electricidad": "purple",
  "Administración": "gray",
};

const CICLO_BADGE: Record<string, BadgeVariant> = {
  GA: "gray",
  AF: "blue",
  SMR: "purple",
  DAM: "blue",
  ASIR: "green",
  DAW: "amber",
  AC: "gray",
  CI: "green",
  LT: "amber",
};

const CICLO_LABEL: Record<string, string> = {
  "Gestión Administrativa": "GA",
  "Administración y Finanzas": "AF",
  "Sistemas Microinformáticos y Redes": "SMR",
  "Desarrollo de Aplicaciones Multiplataforma": "DAM",
  "Desarrollo de Aplicaciones Multiplataforma (Semipresencial)": "DAM",
  "Administración de Sistemas Informáticos en Red": "ASIR",
  "Desarrollo de Aplicaciones Web": "DAW",
  "Actividades Comerciales": "AC",
  "Comercio Internacional": "CI",
  "Comercio Internacional (Semipresencial)": "CI",
  "Logística y Transporte": "LT",
};


function getCicloAbreviado(ciclo?: string | null) {
  if (!ciclo) return "—";

  const palabras = ciclo
    .replace(/\(.*?\)/g, "")
    .split(" ")
    .filter((palabra) => palabra.length > 0 && palabra.toLowerCase() !== "y");

  return palabras.map((palabra) => palabra[0]?.toUpperCase() ?? "").join("");
}


const CICLOS_FORMATIVOS = [
  "Gestión Administrativa",
  "Administración y Finanzas",
  "Sistemas Microinformáticos y Redes",
  "Desarrollo de Aplicaciones Multiplataforma",
  "Desarrollo de Aplicaciones Multiplataforma (Semipresencial)",
  "Administración de Sistemas Informáticos en Red",
  "Desarrollo de Aplicaciones Web",
  "Actividades Comerciales",
  "Comercio Internacional",
  "Comercio Internacional (Semipresencial)",
  "Logística y Transporte",
];

const EMPTY_FORM: EmpresaInput = {
  nombre: "",
  cif: "",
  direccion: "",
  localidad: "",
  sector: "",
  cicloFormativo: "",
  telefono: "",
  email: "",
  contacto: "",
  emailContacto: "",
};

const PER_PAGE = 5;

export default function EmpresasPage() {
  const [form, setForm] = useState<EmpresaInput>(EMPTY_FORM);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [sector, setSector] = useState("");
  const [localidad, setLocalidad] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof EmpresaInput) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function cargarEmpresas() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (sector) params.set("sector", sector);
      if (localidad) params.set("localidad", localidad);
      if (search) params.set("search", search);
      params.set("page", String(page));

      const res = await fetch(`/api/empresas?${params.toString()}`, {
        cache: "no-store",
      });

      const json: ApiResponse<PaginatedEmpresas> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setEmpresas(json.data.items);
      setTotal(json.data.total);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las empresas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarEmpresas();
  }, [sector, localidad, search, page]);

  const handleGuardar = async () => {
    if (!form.nombre || !form.cif || !form.localidad || !form.sector) {
      alert("Nombre, CIF, localidad y sector son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/empresas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json: ApiResponse<Empresa> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      setForm(EMPTY_FORM);
      setPage(1);
      await cargarEmpresas();
    } catch (error) {
      console.error(error);
      alert("No se pudo guardar la empresa.");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Eliminar esta empresa?")) return;

    try {
      const res = await fetch(`/api/empresas/${id}`, {
        method: "DELETE",
      });

      const json: ApiResponse<null> = await res.json();

      if (!json.ok) {
        alert(json.error);
        return;
      }

      await cargarEmpresas();
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la empresa.");
    }
  };

  return (
    <div>
      <PageHeader
        breadcrumb="Inicio"
        breadcrumbHighlight="/ Empresas"
        title="Gestión de Empresas"
        subtitle="Alta de nuevas empresas y consulta del directorio de colaboradoras."
      />

      <SectionLabel>Alta de empresa</SectionLabel>
      <Card className="mb-7">
        <CardHeader>
          <CardTitle icon="🏢" iconVariant="blue">Nueva Empresa</CardTitle>
          <Tag>📝 Formulario de alta</Tag>
        </CardHeader>

        <div className="p-6">
          <FormRow cols={2}>
            <FormGroup label="Nombre de la empresa *">
              <input
                className={INPUT_CLS}
                value={form.nombre}
                onChange={(e) => set("nombre")(e.target.value)}
                placeholder="Ej: Tecnologías Mediterráneo S.L."
              />
            </FormGroup>

            <FormGroup label="CIF *">
              <input
                className={INPUT_CLS}
                value={form.cif}
                onChange={(e) => set("cif")(e.target.value)}
                placeholder="Ej: B12345678"
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={2}>
            <FormGroup label="Dirección">
              <input
                className={INPUT_CLS}
                value={form.direccion}
                onChange={(e) => set("direccion")(e.target.value)}
                placeholder="Calle, número, piso..."
              />
            </FormGroup>

            <FormGroup label="Localidad *">
              <input
                className={INPUT_CLS}
                value={form.localidad}
                onChange={(e) => set("localidad")(e.target.value)}
                placeholder="Ej: Valencia"
              />
            </FormGroup>
          </FormRow>

          <FormRow cols={3}>
            <FormGroup label="Teléfono">
              <input
                className={INPUT_CLS}
                value={form.telefono}
                onChange={(e) => set("telefono")(e.target.value)}
                placeholder="963 000 000"
              />
            </FormGroup>

            <FormGroup label="Sector *">
              <select
                className={INPUT_CLS}
                value={form.sector}
                onChange={(e) => set("sector")(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {SECTORES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FormGroup>

            <FormGroup label="Ciclo formativo">
              <select
                className={INPUT_CLS}
                value={form.cicloFormativo}
                onChange={(e) => set("cicloFormativo")(e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {CICLOS_FORMATIVOS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow cols={3}>
            <FormGroup label="Persona de contacto">
              <input
                className={INPUT_CLS}
                value={form.contacto}
                onChange={(e) => set("contacto")(e.target.value)}
                placeholder="Nombre y apellidos"
              />
            </FormGroup>

            <FormGroup label="Correo empresa">
              <input
                className={INPUT_CLS}
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
                placeholder="contacto@empresa.com"
              />
            </FormGroup>

            <FormGroup label="Correo contacto">
              <input
                className={INPUT_CLS}
                type="email"
                value={form.emailContacto}
                onChange={(e) => set("emailContacto")(e.target.value)}
                placeholder="responsable@empresa.com"
              />
            </FormGroup>
          </FormRow>
        </div>

        <div className="px-6 pb-6 flex gap-2.5 justify-end">
          <Button variant="secondary" onClick={() => setForm(EMPTY_FORM)}>
            ✕ Limpiar
          </Button>
          <Button variant="primary" onClick={handleGuardar}>
            {saving ? "Guardando..." : "✓ Guardar empresa"}
          </Button>
        </div>
      </Card>

      <SectionLabel>Directorio de empresas</SectionLabel>
      <Card>
        <TableFilters>
          <span className="text-[0.78rem] text-text-light font-medium">Filtrar por:</span>

          <FilterSelect value={sector} onChange={(v) => { setSector(v); setPage(1); }}>
            <option value="">Todos los sectores</option>
            {SECTORES.map((s) => <option key={s}>{s}</option>)}
          </FilterSelect>

          <FilterSelect value={localidad} onChange={(v) => { setLocalidad(v); setPage(1); }}>
            <option value="">Todas las localidades</option>
            {LOCALIDADES.map((l) => <option key={l}>{l}</option>)}
          </FilterSelect>

          <SearchBox
            value={search}
            onChange={(v) => { setSearch(v); setPage(1); }}
            placeholder="Buscar empresa..."
          />
        </TableFilters>

        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>CIF</th>
                <th>Localidad</th>
                <th>Sector</th>
                <th>Ciclo</th>
                <th>Contacto</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && empresas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    No se encontraron empresas.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-text-light">
                    Cargando empresas...
                  </td>
                </tr>
              ) : (
                empresas.map((e) => (
                  <tr key={e.id}>
                    <td><strong>{e.nombre}</strong></td>
                    <td className="text-text-mid">{e.cif}</td>
                    <td>{e.localidad}</td>
                    <td><Badge variant={SECTOR_BADGE[e.sector] ?? "gray"}>{e.sector}</Badge></td>
                    <td>
                      <Badge variant={CICLO_BADGE[CICLO_LABEL[e.cicloFormativo ?? ""]] ?? "gray"}>
                        {CICLO_LABEL[e.cicloFormativo ?? ""] ?? "—"}
                      </Badge>
                    </td>

                    <td>{e.contacto ?? "—"}</td>
                    <td>{e.telefono ?? "—"}</td>
                    <td>
                      <TdActions>
                        <Button variant="secondary" size="sm">✏️</Button>
                        <Button variant="danger" size="sm" onClick={() => handleEliminar(e.id)}>
                          🗑️
                        </Button>
                      </TdActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination page={page} total={total} perPage={PER_PAGE} onPageChange={setPage} />
      </Card>
    </div>
  );
}
