"use client";

import Link from "next/link";
import type { AuthMode } from "@/modules/auth/config";
import type { AuthSessionState, SessionUser } from "@/components/layout/useAuthSession";

type Props = {
  authMode: AuthMode;
  session: AuthSessionState;
  variant?: "navbar" | "portal";
};

function getRoleLabel(role: SessionUser["rol"]) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "ALUMNO":
      return "Alumno";
    default:
      return "Profesor";
  }
}

export default function AuthSessionControl({ authMode, session, variant = "navbar" }: Props) {
  const { sessionUser, loadingSession, loggingOut, menuOpen, menuRef, setMenuOpen, handleLogout } = session;
  const initials = sessionUser?.iniciales || sessionUser?.nombre.slice(0, 2).toUpperCase() || "--";
  const isPortal = variant === "portal";

  const wrapperClassName = isPortal
    ? "rounded-2xl border border-[#e7d9d3] bg-white/92 px-2 py-1.5 shadow-[0_10px_24px_rgba(43,28,32,0.10)]"
    : "rounded-2xl border border-white/14 bg-white/10 px-2 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm";
  const loadingClassName = isPortal ? "flex items-center gap-2.5 text-[0.86rem] text-navy" : "flex items-center gap-2.5 text-[0.86rem] text-white";
  const loadingAvatarClassName = isPortal
    ? "flex h-9 w-9 items-center justify-center rounded-full bg-[#efe4df] text-[0.8rem] font-bold text-navy shadow-sm"
    : "flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-[0.8rem] font-bold text-navy shadow-sm";
  const loadingTextClassName = isPortal
    ? "hidden font-semibold tracking-[0.01em] text-navy md:inline"
    : "hidden font-semibold tracking-[0.01em] text-white md:inline";
  const toggleButtonClassName = isPortal
    ? "flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[0.8rem] font-bold text-white shadow-sm transition hover:brightness-105"
    : "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[0.8rem] font-bold text-navy shadow-sm transition hover:brightness-105";

  return (
    <div className={wrapperClassName}>
      {loadingSession ? (
        <div className={loadingClassName}>
          <div className={loadingAvatarClassName}>..</div>
          <span className={loadingTextClassName}>Cargando</span>
        </div>
      ) : sessionUser ? (
        <div ref={menuRef} className="relative z-40 flex items-center text-[0.86rem] text-white">
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            className={toggleButtonClassName}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Abrir menú de usuario"
          >
            {initials}
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[240px] rounded-[18px] border border-white/20 bg-white p-2 text-navy shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-[0.84rem] font-semibold">{sessionUser.nombre}</p>
                <p className="truncate text-[0.76rem] text-slate-500">({getRoleLabel(sessionUser.rol)})</p>
                <p className="truncate text-[0.76rem] text-slate-500">{sessionUser.email}</p>
              </div>
              {authMode === "local" ? (
                <Link
                  href="/cuenta/password"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 block rounded-[12px] px-3 py-2 text-[0.84rem] font-medium text-navy transition hover:bg-slate-50"
                >
                  Cambiar contraseña
                </Link>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="mt-1 w-full rounded-[12px] px-3 py-2 text-left text-[0.84rem] font-medium text-[#7a2237] transition hover:bg-[#fff3f5] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? "Cerrando sesión..." : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-[0.82rem] font-semibold text-white transition hover:brightness-105"
        >
          Login
        </Link>
      )}
    </div>
  );
}
