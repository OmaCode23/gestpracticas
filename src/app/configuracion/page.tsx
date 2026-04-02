import { unstable_noStore as noStore } from "next/cache";
import { getCiclosFormativos } from "@/modules/catalogos/actions/queries";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";
import ConfiguracionPanel from "@/modules/configuracion/components/ConfiguracionPanel";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  noStore();

  const [ciclosFormativos, configuracionAcademica] = await Promise.all([
    getCiclosFormativos(),
    getConfiguracionAcademica(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-[0.78rem] text-text-light">
          Inicio <span className="text-blue">/ Configuración</span>
        </p>
        <h1 className="font-display text-[1.75rem] font-bold leading-tight text-navy">
          Configuración
        </h1>
      </div>

      <ConfiguracionPanel
        ciclosFormativos={ciclosFormativos}
        configuracionAcademica={configuracionAcademica}
      />
    </div>
  );
}
