"use client";

import { FormEvent, useMemo, useState } from "react";
import type { AuthMode } from "@/modules/auth/config";

type ManagedUser = {
  id: number;
  nombre: string;
  email: string;
  iniciales: string | null;
  rol: "ADMIN" | "PROFESOR" | "ALUMNO";
  activo: boolean;
  authProvider: "LOCAL" | "GVA" | null;
  lastLoginAt: string | Date | null;
  mustChangePass: boolean;
  hasLocalAuth: boolean;
};

type Props = {
  initialUsers: ManagedUser[];
  authMode: AuthMode;
};

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROFESOR", label: "Profesor" },
  { value: "ALUMNO", label: "Alumno" },
] as const;

function formatDate(value: string | Date | null) {
  if (!value) {
    return "Sin accesos";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default function UsuariosAdminPanel({ initialUsers, authMode }: Props) {
  const localMode = authMode === "local";
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | ManagedUser["rol"]>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [passwordResetId, setPasswordResetId] = useState<number | null>(null);
  const [passwordInputs, setPasswordInputs] = useState<Record<number, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.nombre.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchesRole = roleFilter === "ALL" || user.rol === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.activo) ||
        (statusFilter === "INACTIVE" && !user.activo);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  async function refreshUsers() {
    const response = await fetch("/api/usuarios", { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<ManagedUser[]>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "No se pudo recargar la lista." : payload.error);
    }

    setUsers(payload.data);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      nombre: String(formData.get("nombre") ?? ""),
      email: String(formData.get("email") ?? ""),
      rol: String(formData.get("rol") ?? "PROFESOR"),
      activo: formData.get("activo") === "on",
      ...(localMode ? { password: String(formData.get("password") ?? "") } : {}),
    };

    try {
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse<{ id: number }>;

      if (!response.ok || !result.ok) {
        setError(result.ok ? "No se pudo crear el usuario." : result.error);
        return;
      }

      event.currentTarget.reset();
      await refreshUsers();
      setFeedback("Usuario creado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:create]", requestError);
      setError("No se pudo crear el usuario.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(userId: number, formData: FormData) {
    setSavingId(userId);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: String(formData.get("nombre") ?? ""),
          email: String(formData.get("email") ?? ""),
          rol: String(formData.get("rol") ?? "PROFESOR"),
          activo: formData.get("activo") === "on",
        }),
      });
      const payload = (await response.json()) as ApiResponse<null>;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "No se pudo actualizar el usuario." : payload.error);
        return;
      }

      await refreshUsers();
      setFeedback("Usuario actualizado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:update]", requestError);
      setError("No se pudo actualizar el usuario.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleResetPassword(userId: number, password: string) {
    setPasswordResetId(userId);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const payload = (await response.json()) as ApiResponse<null>;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "No se pudo restablecer la contrasena." : payload.error);
        return;
      }

      await refreshUsers();
      setFeedback("Contrasena temporal restablecida.");
      setPasswordInputs((current) => ({ ...current, [userId]: "" }));
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:reset]", requestError);
      setError("No se pudo restablecer la contrasena.");
    } finally {
      setPasswordResetId(null);
    }
  }

  async function handleDeleteUser(userId: number, label: string) {
    const confirmed = window.confirm(
      `Se eliminara el usuario "${label}". Esta accion borra su acceso local y sus sesiones.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(userId);
    setError(null);
    setFeedback(null);

    try {
      const response = await fetch(`/api/usuarios/${userId}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as ApiResponse<null>;

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "No se pudo eliminar el usuario." : payload.error);
        return;
      }

      await refreshUsers();
      setFeedback("Usuario eliminado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:delete]", requestError);
      setError("No se pudo eliminar el usuario.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-card">
        <p className="mb-2 text-[0.78rem] text-text-light">
          Configuracion <span className="text-blue">/ Usuarios</span>
        </p>
        <h1 className="font-display text-[1.75rem] font-bold text-navy">Gestion de usuarios</h1>
        <p className="mt-2 max-w-3xl text-[0.92rem] leading-relaxed text-text-mid">
          {localMode
            ? "Esta pantalla administra el acceso autorizado a la aplicacion. La autenticacion actual es local y temporal; mas adelante podra sustituirse por `edu.gva.es` manteniendo esta misma base de usuarios."
            : "Esta pantalla administra el acceso autorizado a la aplicacion para el futuro login externo. Aqui solo se controla quien puede entrar y con que rol."}
        </p>
      </section>

      <section className="glass-panel rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-card">
        <h2 className="text-[1.05rem] font-semibold text-navy">Alta de usuario</h2>
        <form onSubmit={handleCreate} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="create-nombre">
              Nombre
            </label>
            <input
              id="create-nombre"
              name="nombre"
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
              required
            />
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="create-email">
              Email
            </label>
            <input
              id="create-email"
              name="email"
              type="email"
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
              required
            />
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="create-rol">
              Rol
            </label>
            <select
              id="create-rol"
              name="rol"
              defaultValue="PROFESOR"
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {localMode ? (
            <div>
              <label className="text-[0.8rem] font-semibold text-navy" htmlFor="create-password">
                Contrasena temporal
              </label>
              <input
                id="create-password"
                name="password"
                type="password"
                minLength={8}
                className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
                required
              />
            </div>
          ) : (
            <div className="rounded-[16px] border border-[#ead7d7] bg-[#fffaf7] px-4 py-4 text-[0.84rem] text-text-mid">
              En modo de autenticacion externa no se almacenan contrasenas locales.
            </div>
          )}

          <label className="flex items-center gap-2 text-[0.86rem] font-medium text-navy">
            <input type="checkbox" name="activo" defaultChecked className="h-4 w-4" />
            Usuario activo
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-accent px-5 py-3 text-[0.9rem] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>

        {feedback ? (
          <p className="mt-4 rounded-[14px] border border-[#cfe3d7] bg-[#eef8f1] px-4 py-3 text-[0.84rem] text-[#2f6a43]">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-[14px] border border-[#e8c7cd] bg-[#fff3f5] px-4 py-3 text-[0.84rem] text-[#7a2237]">
            {error}
          </p>
        ) : null}
      </section>

      <section className="glass-panel rounded-[28px] border border-white/70 bg-white/84 p-6 shadow-card">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="users-search">
              Buscar
            </label>
            <input
              id="users-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o email"
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
            />
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="users-role-filter">
              Rol
            </label>
            <select
              id="users-role-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
            >
              <option value="ALL">Todos</option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[0.8rem] font-semibold text-navy" htmlFor="users-status-filter">
              Estado
            </label>
            <select
              id="users-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 text-[0.92rem] text-navy"
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {visibleUsers.map((user) => (
          <form
            key={user.id}
            onSubmit={(event) => {
              event.preventDefault();
              void handleSave(user.id, new FormData(event.currentTarget));
            }}
            className="glass-panel rounded-[24px] border border-white/70 bg-white/84 p-5 shadow-card"
          >
            <div className="grid gap-4 md:grid-cols-[1.2fr_1.2fr_0.7fr_0.7fr]">
              <div>
                <label className="text-[0.78rem] font-semibold text-navy">Nombre</label>
                <input
                  name="nombre"
                  defaultValue={user.nombre}
                  className="mt-2 w-full rounded-[12px] border border-border bg-white px-3 py-2.5 text-[0.9rem] text-navy"
                />
              </div>

              <div>
                <label className="text-[0.78rem] font-semibold text-navy">Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  className="mt-2 w-full rounded-[12px] border border-border bg-white px-3 py-2.5 text-[0.9rem] text-navy"
                />
              </div>

              <div>
                <label className="text-[0.78rem] font-semibold text-navy">Rol</label>
                <select
                  name="rol"
                  defaultValue={user.rol}
                  className="mt-2 w-full rounded-[12px] border border-border bg-white px-3 py-2.5 text-[0.9rem] text-navy"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 text-[0.84rem] font-medium text-navy">
                  <input type="checkbox" name="activo" defaultChecked={user.activo} className="h-4 w-4" />
                  Activo
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[0.8rem] text-text-mid">
              <span className="rounded-full bg-surface2 px-3 py-1">
                Proveedor: {user.authProvider ?? "pendiente"}
              </span>
              <span className="rounded-full bg-surface2 px-3 py-1">
                Ultimo acceso: {formatDate(user.lastLoginAt)}
              </span>
              {localMode ? (
                <span className="rounded-full bg-surface2 px-3 py-1">
                  Password temporal: {user.mustChangePass ? "pendiente de cambio" : "establecida"}
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={savingId === user.id}
                className="rounded-full bg-accent px-4 py-2.5 text-[0.84rem] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingId === user.id ? "Guardando..." : "Guardar cambios"}
              </button>

              {localMode ? (
                <>
                  <input
                    type="password"
                    minLength={8}
                    value={passwordInputs[user.id] ?? ""}
                    onChange={(event) =>
                      setPasswordInputs((current) => ({
                        ...current,
                        [user.id]: event.target.value,
                      }))
                    }
                    placeholder="Nueva contrasena temporal"
                    className="min-w-[220px] rounded-full border border-border bg-white px-4 py-2.5 text-[0.84rem] text-navy"
                  />
                  <button
                    type="button"
                    disabled={
                      passwordResetId === user.id || (passwordInputs[user.id] ?? "").length < 8
                    }
                    onClick={() => void handleResetPassword(user.id, passwordInputs[user.id] ?? "")}
                    className="rounded-full border border-border bg-white px-4 py-2.5 text-[0.84rem] font-semibold text-navy transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {passwordResetId === user.id ? "Actualizando..." : "Resetear contrasena"}
                  </button>
                </>
              ) : null}

              <button
                type="button"
                disabled={deletingId === user.id}
                onClick={() => void handleDeleteUser(user.id, `${user.nombre} <${user.email}>`)}
                className="rounded-full border border-[#e8c7cd] bg-[#fff3f5] px-4 py-2.5 text-[0.84rem] font-semibold text-[#7a2237] transition hover:bg-[#fdecef] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deletingId === user.id ? "Eliminando..." : "Eliminar usuario"}
              </button>
            </div>
          </form>
        ))}
      </section>
    </div>
  );
}
