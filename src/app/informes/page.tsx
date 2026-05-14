import InformesPanel from "@/modules/informes/components/InformesPanel";
import { requireStaffSession } from "@/modules/auth/session";

export default async function InformesPage() {
  await requireStaffSession("/informes");

  return <InformesPanel />;
}
