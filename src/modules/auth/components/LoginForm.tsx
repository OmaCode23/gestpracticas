"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AuthMode } from "@/modules/auth/config";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Props = {
  authMode: AuthMode;
  externalConfigured: boolean;
};

function PasswordVisibilityButton({
  visible,
  onClick,
}: {
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-mid transition hover:text-navy"
      aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
    >
      {visible ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3l18 18" />
          <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
          <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7-.37.84-1.05 1.96-2 3.02" />
          <path d="M6.61 6.61C4.62 7.9 3.07 9.73 2 12c1.73 3.89 6 7 10 7 1.61 0 3.16-.4 4.55-1.1" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}

function getErrorMessage(code: string | null) {
  switch (code) {
    case "external-not-configured":
      return "El acceso institucional no está disponible en este momento.";
    case "external-start-failed":
      return "No se pudo iniciar el acceso institucional.";
    case "external-provider-error":
      return "Se produjo un error durante el acceso institucional.";
    case "external-state-missing":
      return "La respuesta del proveedor externo no incluyó el estado esperado.";
    case "external-state-mismatch":
      return "El estado de autenticación externo no coincide con la sesión iniciada.";
    case "external-state-invalid":
      return "El estado devuelto por el proveedor externo no es válido.";
    case "external-callback-pending":
      return "No se pudo completar el acceso institucional.";
    case "external-user-not-authorized":
      return "La identidad autenticada no existe como usuario activo y autorizado en la aplicación.";
    case "external-mode-disabled":
      return "Esta ruta solo puede usarse cuando AUTH_MODE=external.";
    default:
      return null;
  }
}

export default function LoginForm({ authMode, externalConfigured }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const externalError = getErrorMessage(searchParams.get("error"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(externalError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authMode !== "local") {
      setError("El acceso institucional no está disponible en esta instalación.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json()) as ApiResponse<{ mustChangePass: boolean }>;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "No se pudo iniciar sesión." : payload.error);
        return;
      }

      router.replace(payload.data.mustChangePass ? "/cuenta/password" : nextPath);
      router.refresh();
    } catch (requestError) {
      console.error("[LoginForm]", requestError);
      setError("No se pudo iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel mx-auto w-full max-w-md rounded-[28px] border border-white/70 bg-white/85 p-7 shadow-card"
    >
      <p className="mb-2 text-[0.78rem] text-text-light">
        Acceso <span className="text-blue">/ GestPracticas</span>
      </p>
      <h1 className="font-display text-[1.7rem] font-bold text-navy">Iniciar sesión</h1>
      <p className="mt-2 text-[0.92rem] text-text-mid">
        {authMode === "local"
          ? "Accede con tus credenciales autorizadas para continuar en la aplicación."
          : "Accede con tu identidad institucional autorizada para continuar en la aplicación."}
      </p>

      <label className="mt-6 block text-[0.82rem] font-semibold text-navy" htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        autoComplete="username"
        className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
        placeholder="nombre@edu.gva.es"
        required
      />

      {authMode === "local" ? (
        <>
          <label
            className="mt-4 block text-[0.82rem] font-semibold text-navy"
            htmlFor="login-password"
          >
            Contraseña
          </label>
          <div className="relative mt-2">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              data-hide-native-password-toggle="true"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-[14px] border border-border bg-white px-4 py-3 pr-14 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
              placeholder="Introduce tu contraseña"
              required
            />
            <PasswordVisibilityButton
              visible={showPassword}
              onClick={() => setShowPassword((current) => !current)}
            />
          </div>
        </>
      ) : (
        <p className="mt-4 rounded-[14px] border border-[#ead7d7] bg-[#fffaf7] px-4 py-3 text-[0.84rem] text-text-mid">
          El acceso a esta instalación se realiza mediante identidad institucional.
        </p>
      )}

      {error ? (
        <p className="mt-4 rounded-[14px] border border-[#e8c7cd] bg-[#fff3f5] px-4 py-3 text-[0.84rem] text-[#7a2237]">
          {error}
        </p>
      ) : null}

      {authMode === "local" ? (
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(159,29,62,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Accediendo..." : "Entrar"}
        </button>
      ) : externalConfigured ? (
        <a
          href={`/api/auth/external/start?next=${encodeURIComponent(nextPath)}`}
          className="mt-6 block w-full rounded-full bg-accent px-4 py-3 text-center text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(159,29,62,0.22)] transition hover:brightness-105"
        >
          Continuar con proveedor externo
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(159,29,62,0.22)] opacity-70"
        >
          Acceso institucional no disponible
        </button>
      )}
    </form>
  );
}
