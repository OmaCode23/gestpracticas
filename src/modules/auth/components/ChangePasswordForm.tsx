"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

type Props = {
  mustChangePass: boolean;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
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

function PasswordField({ id, label, value, autoComplete, onChange }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="mt-4 block text-[0.82rem] font-semibold text-navy" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? "text" : "password"}
          data-hide-native-password-toggle="true"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-[14px] border border-border bg-white px-4 py-3 pr-14 text-[0.95rem] text-navy outline-none transition focus:border-blue-light"
          required
        />
        <PasswordVisibilityButton
          visible={visible}
          onClick={() => setVisible((current) => !current)}
        />
      </div>
    </div>
  );
}

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
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmación de la nueva contraseña no coincide.");
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
        setError(payload.ok ? "No se pudo actualizar la contraseña." : payload.error);
        return;
      }

      setSuccess("Contraseña actualizada correctamente.");
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
      setError("No se pudo actualizar la contraseña.");
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
      <h1 className="font-display text-[1.7rem] font-bold text-navy">Cambiar contraseña</h1>
      <p className="mt-2 text-[0.92rem] text-text-mid">
        {mustChangePass
          ? "Debes actualizar tu contraseña antes de continuar usando la aplicación."
          : "Puedes actualizar tu contraseña siempre que lo necesites."}
      </p>

      <PasswordField
        id="current-password"
        label="Contraseña actual"
        value={currentPassword}
        autoComplete="current-password"
        onChange={setCurrentPassword}
      />

      <PasswordField
        id="new-password"
        label="Nueva contraseña"
        value={newPassword}
        autoComplete="new-password"
        onChange={setNewPassword}
      />

      <PasswordField
        id="confirm-password"
        label="Confirmar nueva contraseña"
        value={confirmPassword}
        autoComplete="new-password"
        onChange={setConfirmPassword}
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
        {submitting ? "Guardando..." : "Actualizar contraseña"}
      </button>
    </form>
  );
}
