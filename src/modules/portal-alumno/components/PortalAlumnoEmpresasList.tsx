"use client";

import { useState } from "react";
import { Badge, Button, Card } from "@/components/ui";

type EmpresaPortal = {
  id: number;
  nombre: string;
  sector: string;
  localidad: string;
  cicloFormativo: string;
  cicloFormativoCodigo: string | null;
};

const INITIAL_VISIBLE = 24;
const LOAD_MORE_STEP = 12;

export default function PortalAlumnoEmpresasList({ empresas }: { empresas: EmpresaPortal[] }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  if (empresas.length === 0) {
    return (
      <Card className="p-5">
        <p className="text-sm text-text-mid">No hay empresas registradas todavía.</p>
      </Card>
    );
  }

  const visibleEmpresas = empresas.slice(0, visibleCount);
  const hasMore = visibleCount < empresas.length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleEmpresas.map((empresa) => (
          <Card key={empresa.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-navy">{empresa.nombre}</h2>
                <p className="mt-1 text-sm text-text-mid">{empresa.localidad}</p>
              </div>
              <Badge variant="green">{empresa.cicloFormativoCodigo ?? "Ciclos"}</Badge>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-text-mid">
              <p>
                <span className="font-semibold text-navy">Sector:</span> {empresa.sector}
              </p>
              <p>
                <span className="font-semibold text-navy">Ciclo:</span> {empresa.cicloFormativo}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {hasMore ? (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            type="button"
            onClick={() => setVisibleCount((current) => current + LOAD_MORE_STEP)}
          >
            Ver más empresas
          </Button>
        </div>
      ) : null}
    </div>
  );
}
