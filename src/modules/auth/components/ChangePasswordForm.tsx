"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Props = {
  mustChangePass: boolean;
};

export default function ChangePasswordForm({ mustChangePass }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmacion de la nueva contrasena no coincide.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const payload = (await response.json()) as ApiResponse<null>;
      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "No se pudo actualizar la contrasena." : payload.error);
        return;
      }

      setSuccess("Contrasena actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();

      if (mustChangePass) {
        window.setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 500);
      }
    } catch (requestError) {
      console.error("[ChangePasswordForm]", requestError);
      setError("No se pudo actualizar la contrasena.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel mx-auto w-full max-w-lg rounded-[28px] border border-white/70 bg-white/85 p-7 shadow-card"
    >
      <p className="mb-2 text-[0.78rem] text-text-light">
        Cuenta <span className="text-blue">/ Seguridad</span>
      </p>
      <h1 className="font-display text-[1.7rem] font-bold text-navy">Cambiar contrasena</h1>
      <p className="mt-2 text-[0.92rem] text-text-mid">
        {mustChangePass
          ? "Debes sustituir la contrasena temporal antes de continuar usando la aplicacion."
          : "Puedes actualizar tu contrasena local siempre que lo necesites."}
      </p>

      <label className="mt-6 block text-[0.82rem] font-semibold text-navy" htmlFor="current-password">
        Contrasena actual
      </label>
      <input
        id="current-password"
        type="password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        autoComplete="current-password"
        className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
        required
      />

      <label className="mt-4 block text-[0.82rem] font-semibold text-navy" htmlFor="new-password">
        Nueva contrasena
      </label>
      <input
        id="new-password"
        type="password"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        autoComplete="new-password"
        className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
        required
      />

      <label
        className="mt-4 block text-[0.82rem] font-semibold text-navy"
        htmlFor="confirm-password"
      >
        Confirmar nueva contrasena
      </label>
      <input
        id="confirm-password"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        autoComplete="new-password"
        className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
        required
      />

      {error ? (
        <p className="mt-4 rounded-[14px] border border-[#e8c7cd] bg-[#fff3f5] px-4 py-3 text-[0.84rem] text-[#7a2237]">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-4 rounded-[14px] border border-[#cfe3d7] bg-[#eef8f1] px-4 py-3 text-[0.84rem] text-[#2f6a43]">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-full bg-accent px-4 py-3 text-[0.92rem] font-semibold text-white shadow-[0_10px_24px_rgba(159,29,62,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Guardando..." : "Actualizar contrasena"}
      </button>
    </form>
  );
}
