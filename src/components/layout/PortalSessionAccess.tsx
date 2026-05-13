"use client";

import type { AuthMode } from "@/modules/auth/config";
import AuthSessionControl from "@/components/layout/AuthSessionControl";
import { useAuthSession } from "@/components/layout/useAuthSession";

type Props = {
  authMode: AuthMode;
};

export default function PortalSessionAccess({ authMode }: Props) {
  const session = useAuthSession("PortalSessionAccess");

  return <AuthSessionControl authMode={authMode} session={session} variant="portal" />;
}
