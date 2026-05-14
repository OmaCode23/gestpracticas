import { redirect } from "next/navigation";
import LoginForm from "@/modules/auth/components/LoginForm";
import { getAuthMode } from "@/modules/auth/config";
import { getExternalAuthSummary } from "@/modules/auth/external";
import { isAlumnoRole } from "@/modules/auth/permissions";
import { getOptionalSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const authMode = getAuthMode();
  const externalSummary = getExternalAuthSummary();
  const session = await getOptionalSession();

  if (session) {
    redirect(
      session.user.mustChangePass
        ? "/cuenta/password"
        : isAlumnoRole(session.user.rol)
          ? "/portal-alumno"
          : "/"
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-2 py-8">
      <LoginForm authMode={authMode} externalConfigured={externalSummary.configured} />
    </div>
  );
}
