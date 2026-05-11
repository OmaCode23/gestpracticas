"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import NavigationFeedback from "@/components/layout/NavigationFeedback";
import RoutePrefetcher from "@/components/layout/RoutePrefetcher";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAlumnoPortal = pathname?.startsWith("/portal-alumno") ?? false;

  return (
    <>
      {!isAlumnoPortal ? <RoutePrefetcher /> : null}
      <Suspense fallback={null}>
        <NavigationFeedback />
      </Suspense>
      {!isAlumnoPortal ? <Navbar /> : null}
      <main
        className={
          isAlumnoPortal
            ? "mx-auto min-h-screen max-w-[1180px] px-4 py-5 md:px-6 md:py-7 xl:px-8"
            : "mx-auto max-w-[1200px] px-4 py-6 md:px-6 md:py-8 xl:px-10 xl:py-9"
        }
      >
        {children}
      </main>
    </>
  );
}
