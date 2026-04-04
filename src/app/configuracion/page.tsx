import { unstable_noStore as noStore } from "next/cache";
import { getCiclosFormativos, getSectores } from "@/modules/catalogos/actions/queries";
import { getConfiguracionAcademica } from "@/modules/settings/actions/queries";
import ConfiguracionPanel from "@/modules/configuracion/components/ConfiguracionPanel";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  noStore();

  const [sectores, ciclosFormativos, configuracionAcademica] = await Promise.all([
    getSectores(),
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
        sectores={sectores}
        ciclosFormativos={ciclosFormativos}
        configuracionAcademica={configuracionAcademica}
      />
    </div>
  );
}
