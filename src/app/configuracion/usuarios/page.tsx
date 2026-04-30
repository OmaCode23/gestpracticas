import { unstable_noStore as noStore } from "next/cache";
import UsuariosAdminPanel from "@/modules/usuarios/components/UsuariosAdminPanel";
import { listManagedUsers } from "@/modules/usuarios/actions";
import { getAuthMode } from "@/modules/auth/config";
import { requireAdminSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  noStore();
  await requireAdminSession("/configuracion/usuarios");
  const users = await listManagedUsers();
  const authMode = getAuthMode();

  return <UsuariosAdminPanel initialUsers={users} authMode={authMode} />;
}
