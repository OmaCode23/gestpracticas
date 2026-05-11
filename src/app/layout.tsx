import type { Metadata } from "next";
import "../app/globals.css";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "GestPracticas - IES El Grao",
  description: "Sistema de gestion de practicas del instituto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
