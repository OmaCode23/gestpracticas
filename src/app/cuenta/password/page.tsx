import { redirect } from "next/navigation";
import ChangePasswordForm from "@/modules/auth/components/ChangePasswordForm";
import { isLocalAuthMode } from "@/modules/auth/config";
import { requireUserSession } from "@/modules/auth/session";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await requireUserSession("/cuenta/password");

  if (!isLocalAuthMode()) {
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-2 py-8">
      <ChangePasswordForm mustChangePass={session.user.mustChangePass} />
    </div>
  );
}
