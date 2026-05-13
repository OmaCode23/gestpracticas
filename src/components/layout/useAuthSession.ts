"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AuthMode } from "@/modules/auth/config";

export type SessionUser = {
  id: number;
  nombre: string;
  email: string;
  iniciales: string | null;
  rol: "ADMIN" | "PROFESOR" | "ALUMNO";
  activo: boolean;
  mustChangePass: boolean;
};

type SessionPayload =
  | {
      ok: true;
      data: { authMode: AuthMode; session: { user: SessionUser; expiresAt: string } | null };
    }
  | { ok: false; error: string };

export type AuthSessionState = {
  sessionUser: SessionUser | null;
  loadingSession: boolean;
  loggingOut: boolean;
  menuOpen: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogout: () => Promise<void>;
};

export function useAuthSession(sourceLabel: string): AuthSessionState {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });
        const payload = (await response.json()) as SessionPayload;

        if (!active) {
          return;
        }

        if (response.ok && payload.ok) {
          setSessionUser(payload.data.session?.user ?? null);
        } else {
          setSessionUser(null);
        }
      } catch (error) {
        console.error(`[${sourceLabel}] No se pudo recuperar la sesion`, error);
        if (active) {
          setSessionUser(null);
        }
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    void loadSession();

    return () => {
      active = false;
    };
  }, [pathname, sourceLabel]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    setMenuOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } catch (error) {
      console.error(`[${sourceLabel}] No se pudo cerrar la sesion`, error);
    } finally {
      setSessionUser(null);
      setLoggingOut(false);
      router.replace("/login");
      router.refresh();
    }
  }

  return {
    sessionUser,
    loadingSession,
    loggingOut,
    menuOpen,
    menuRef,
    setMenuOpen,
    handleLogout,
  };
}
