import { unstable_noStore as noStore } from "next/cache";
import PortalCursosContent from "@/modules/portal-alumno/components/PortalCursosContent";
import { requireStaffSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function CursosPage() {
  noStore();
  await requireStaffSession("/cursos");

  return <PortalCursosContent />;
}
