import type { Metadata } from "next";
import "../app/globals.css";
import { getAuthMode } from "@/modules/auth/config";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "GestPracticas - IES El Grao",
  description: "Sistema de gestion de practicas del instituto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authMode = getAuthMode();

  return (
    <html lang="es">
      <body>
        <AppShell authMode={authMode}>{children}</AppShell>
      </body>
    </html>
  );
}
