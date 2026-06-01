import { unstable_noStore as noStore } from "next/cache";
import PortalOfertasContent from "@/modules/portal-alumno/components/PortalOfertasContent";
import { requireStaffSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function OfertasPage() {
  noStore();
  await requireStaffSession("/ofertas");

  return <PortalOfertasContent />;
}
