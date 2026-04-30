import InformesPanel from "@/modules/informes/components/InformesPanel";
import { requireUserSession } from "@/modules/auth/session";

export default async function InformesPage() {
  await requireUserSession("/informes");

  return <InformesPanel />;
}
