import type { Metadata } from "next";
import { Suspense } from "react";
import "../app/globals.css";
import Navbar from "@/components/layout/Navbar";
import NavigationFeedback from "@/components/layout/NavigationFeedback";
import RoutePrefetcher from "@/components/layout/RoutePrefetcher";
import { getAuthMode } from "@/modules/auth/config";

export const metadata: Metadata = {
  title: "GestPracticas - IES El Grao",
  description: "Sistema de gestion de practicas del instituto",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const authMode = getAuthMode();

  return (
    <html lang="es">
      <body>
        <RoutePrefetcher />
        <Suspense fallback={null}>
          <NavigationFeedback />
        </Suspense>
        <Navbar authMode={authMode} />
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8 xl:px-10 xl:py-9">{children}</main>
      </body>
    </html>
  );
}
