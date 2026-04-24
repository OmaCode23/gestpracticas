"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const PREFETCH_ROUTES = [
  "/",
  "/empresas",
  "/alumnos",
  "/formacion",
  "/importexport",
  "/informes",
  "/configuracion",
] as const;

export default function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchAll = () => {
      if (cancelled) return;

      for (const route of PREFETCH_ROUTES) {
        router.prefetch(route);
      }
    };

    const hasRequestIdleCallback =
      typeof window !== "undefined" && "requestIdleCallback" in window;

    const idleCallback: number =
      hasRequestIdleCallback
        ? window.requestIdleCallback(prefetchAll, { timeout: 1200 })
        : window.setTimeout(prefetchAll, 250);

    return () => {
      cancelled = true;

      if (!hasRequestIdleCallback) {
        window.clearTimeout(idleCallback);
        return;
      }

      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleCallback);
      }
    };
  }, [router]);

  return null;
}
