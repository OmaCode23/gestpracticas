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

function getErrorMessage(code: string | null) {
  switch (code) {
    case "external-not-configured":
      return "Falta configurar el proveedor externo en las variables de entorno.";
    case "external-start-failed":
      return "No se pudo iniciar el flujo del proveedor externo.";
    case "external-provider-error":
      return "El proveedor externo devolvio un error durante el acceso.";
    case "external-state-missing":
      return "La respuesta del proveedor externo no incluyo el estado esperado.";
    case "external-state-mismatch":
      return "El estado de autenticacion externo no coincide con la sesion iniciada.";
    case "external-state-invalid":
      return "El estado devuelto por el proveedor externo no es valido.";
    case "external-callback-pending":
      return "El callback externo ya esta reservado, pero el intercambio real del codigo aun no esta implementado.";
    case "external-user-not-authorized":
      return "La identidad autenticada no existe como usuario activo y autorizado en la aplicacion.";
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
  const [error, setError] = useState<string | null>(externalError);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authMode !== "local") {
      setError("La autenticacion externa aun no esta integrada en esta instalacion.");
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
        setError(payload.ok ? "No se pudo iniciar sesion." : payload.error);
        return;
      }

      router.replace(payload.data.mustChangePass ? "/cuenta/password" : nextPath);
      router.refresh();
    } catch (requestError) {
      console.error("[LoginForm]", requestError);
      setError("No se pudo iniciar sesion.");
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
      <h1 className="font-display text-[1.7rem] font-bold text-navy">Iniciar sesion</h1>
      <p className="mt-2 text-[0.92rem] text-text-mid">
        {authMode === "local"
          ? "Este acceso es temporal mientras se confirma la integracion con `edu.gva.es`."
          : "La aplicacion queda preparada para autenticacion externa. La integracion con el proveedor final aun no esta implementada."}
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
            Contrasena temporal
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
            placeholder="Introduce tu contrasena"
            required
          />
        </>
      ) : (
        <p className="mt-4 rounded-[14px] border border-[#ead7d7] bg-[#fffaf7] px-4 py-3 text-[0.84rem] text-text-mid">
          Cuando se integre el proveedor externo, el acceso se iniciara desde aqui sin
          contrasena local almacenada en la aplicacion.
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
          Proveedor externo sin configurar
        </button>
      )}
    </form>
  );
}
