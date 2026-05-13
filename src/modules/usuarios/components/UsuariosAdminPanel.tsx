"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  INPUT_CLS,
  PageHeader,
  TableFilters,
  Tag,
} from "@/components/ui";
import SuccessToast from "@/components/ui/SuccessToast";
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

type RoleValue = ManagedUser["rol"];

type CreateFormState = {
  nombre: string;
  email: string;
  rol: RoleValue;
  password: string;
  confirmPassword: string;
};

type ResetPasswordState = {
  userId: number;
  nombre: string;
  password: string;
  confirmPassword: string;
};

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "PROFESOR", label: "Profesor" },
  { value: "ALUMNO", label: "Alumno" },
] as const;

const EMPTY_CREATE_FORM: CreateFormState = {
  nombre: "",
  email: "",
  rol: "PROFESOR",
  password: "",
  confirmPassword: "",
};

function PencilButton({
  title,
  disabled = false,
  onClick,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={[
        "mt-1.5 inline-flex h-4 w-4 items-center justify-center rounded-md border text-[0.46rem] transition-colors",
        disabled
          ? "cursor-not-allowed border-border bg-surface text-text-light opacity-55"
          : "border-border bg-surface2 text-text-mid hover:bg-[#e5d7d0] hover:text-navy",
      ].join(" ")}
    >
      {"\u270F\uFE0F"}
    </button>
  );
}

function SearchField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative w-full max-w-[18rem]">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-text-light">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nombre o email"
        className={`${INPUT_CLS} pl-10`}
        aria-label="Buscar por nombre o email"
      />
    </div>
  );
}

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

function PasswordInput({
  value,
  onChange,
  autoFocus = false,
}: {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        className={`${INPUT_CLS} pr-14`}
        type={visible ? "text" : "password"}
        data-hide-native-password-toggle="true"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        minLength={8}
        autoFocus={autoFocus}
      />
      <PasswordVisibilityButton
        visible={visible}
        onClick={() => setVisible((current) => !current)}
      />
    </div>
  );
}

function formatRole(role: RoleValue) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export default function UsuariosAdminPanel({ initialUsers, authMode }: Props) {
  const localMode = authMode === "local";
  const editingNameRef = useRef<HTMLDivElement | null>(null);
  const editingRoleRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [createForm, setCreateForm] = useState<CreateFormState>(EMPTY_CREATE_FORM);
  const [editingName, setEditingName] = useState<{ id: number; value: string } | null>(null);
  const [editingRole, setEditingRole] = useState<{ id: number; value: RoleValue } | null>(null);
  const [resetPasswordState, setResetPasswordState] = useState<ResetPasswordState | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingNameId, setSavingNameId] = useState<number | null>(null);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [passwordResetId, setPasswordResetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
  const [notification, setNotification] = useState("");

  const activeCount = users.filter((user) => user.activo).length;

  const visibleUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      if (!normalizedSearch) {
        return true;
      }

      return (
        user.nombre.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [search, users]);

  useEffect(() => {
    if (!resetPasswordState) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (passwordResetId === null) {
          setResetPasswordState(null);
          setResetPasswordError(null);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [resetPasswordState, passwordResetId]);

  useEffect(() => {
    if (!editingName) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditingName(null);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!editingNameRef.current?.contains(event.target as Node)) {
        setEditingName(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [editingName]);

  useEffect(() => {
    if (!editingRole) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setEditingRole(null);
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!editingRoleRef.current?.contains(event.target as Node)) {
        setEditingRole(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [editingRole]);

  function resetCreateForm() {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateError(null);
  }

  function closeResetPasswordDialog() {
    if (passwordResetId !== null) {
      return;
    }

    setResetPasswordState(null);
    setResetPasswordError(null);
  }

  async function refreshUsers() {
    const response = await fetch("/api/usuarios", { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<ManagedUser[]>;

    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "No se pudo recargar la lista de usuarios." : payload.error);
    }

    setUsers(payload.data);
  }

  async function updateUser(
    userId: number,
    updates: Partial<Pick<ManagedUser, "nombre" | "rol" | "activo">>
  ) {
    const user = users.find((item) => item.id === userId);
    if (!user) {
      throw new Error("Usuario no encontrado.");
    }

    const response = await fetch(`/api/usuarios/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: updates.nombre ?? user.nombre,
        email: user.email,
        rol: updates.rol ?? user.rol,
        activo: updates.activo ?? user.activo,
      }),
    });

    const payload = (await response.json()) as ApiResponse<null>;
    if (!response.ok || !payload.ok) {
      throw new Error(payload.ok ? "No se pudo actualizar el usuario." : payload.error);
    }
  }

  async function handleCreateUser() {
    setCreating(true);
    setCreateError(null);

    try {
      const nombre = createForm.nombre.trim();
      const email = createForm.email.trim();

      if (!nombre || !email) {
        setCreateError("Debes completar todos los campos obligatorios.");
        return;
      }

      if (localMode) {
        if (!createForm.password || !createForm.confirmPassword) {
          setCreateError("Debes completar todos los campos obligatorios.");
          return;
        }

        if (createForm.password.length < 8) {
          setCreateError("La contraseña debe tener al menos 8 caracteres.");
          return;
        }

        if (createForm.password !== createForm.confirmPassword) {
          setCreateError("La confirmación de la contraseña no coincide.");
          return;
        }
      }

      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          rol: createForm.rol,
          activo: true,
          ...(localMode ? { password: createForm.password } : {}),
        }),
      });

      const payload = (await response.json()) as ApiResponse<{ id: number }>;
      if (!response.ok || !payload.ok) {
        setCreateError(payload.ok ? "No se pudo crear el usuario." : payload.error);
        return;
      }

      await refreshUsers();
      resetCreateForm();
      setNotification("Usuario creado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:create]", requestError);
      setCreateError("No se pudo crear el usuario.");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveName() {
    if (!editingName) {
      return;
    }

    const trimmedName = editingName.value.trim();
    if (!trimmedName) {
      setTableError("El nombre es obligatorio.");
      return;
    }

    setSavingNameId(editingName.id);
    setTableError(null);

    try {
      await updateUser(editingName.id, { nombre: trimmedName });
      await refreshUsers();
      setEditingName(null);
      setNotification("Nombre de usuario actualizado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:saveName]", requestError);
      setTableError(
        requestError instanceof Error ? requestError.message : "No se pudo actualizar el usuario."
      );
    } finally {
      setSavingNameId(null);
    }
  }

  async function handleSaveRole() {
    if (!editingRole) {
      return;
    }

    setSavingRoleId(editingRole.id);
    setTableError(null);

    try {
      await updateUser(editingRole.id, { rol: editingRole.value });
      await refreshUsers();
      setEditingRole(null);
      setNotification("Rol de usuario actualizado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:saveRole]", requestError);
      setTableError(
        requestError instanceof Error ? requestError.message : "No se pudo actualizar el usuario."
      );
    } finally {
      setSavingRoleId(null);
    }
  }

  async function handleToggleActivo(user: ManagedUser) {
    setTogglingId(user.id);
    setTableError(null);

    try {
      await updateUser(user.id, { activo: !user.activo });
      await refreshUsers();
      setNotification(
        user.activo ? "Usuario desactivado correctamente." : "Usuario activado correctamente."
      );
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:toggle]", requestError);
      setTableError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el estado del usuario."
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleResetPassword() {
    if (!resetPasswordState) {
      return;
    }

    setPasswordResetId(resetPasswordState.userId);
    setResetPasswordError(null);

    try {
      if (!resetPasswordState.password || !resetPasswordState.confirmPassword) {
        setResetPasswordError("Debes completar todos los campos de la contraseña.");
        return;
      }

      if (resetPasswordState.password.length < 8) {
        setResetPasswordError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }

      if (resetPasswordState.password !== resetPasswordState.confirmPassword) {
        setResetPasswordError("La confirmación de la contraseña no coincide.");
        return;
      }

      const response = await fetch(`/api/usuarios/${resetPasswordState.userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPasswordState.password }),
      });

      const payload = (await response.json()) as ApiResponse<null>;
      if (!response.ok || !payload.ok) {
        setResetPasswordError(
          payload.ok ? "No se pudo restablecer la contraseña." : payload.error
        );
        return;
      }

      await refreshUsers();
      setResetPasswordState(null);
      setResetPasswordError(null);
      setNotification("Contraseña restablecida correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:reset]", requestError);
      setResetPasswordError("No se pudo restablecer la contraseña.");
    } finally {
      setPasswordResetId(null);
    }
  }

  async function handleDeleteUser(user: ManagedUser) {
    const confirmed = window.confirm(
      `Se eliminará el usuario "${user.nombre}". Esta acción borra su acceso local y sus sesiones.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(user.id);
    setTableError(null);

    try {
      const response = await fetch(`/api/usuarios/${user.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as ApiResponse<null>;
      if (!response.ok || !payload.ok) {
        setTableError(payload.ok ? "No se pudo eliminar el usuario." : payload.error);
        return;
      }

      await refreshUsers();
      setNotification("Usuario eliminado correctamente.");
    } catch (requestError) {
      console.error("[UsuariosAdminPanel:delete]", requestError);
      setTableError("No se pudo eliminar el usuario.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <SuccessToast message={notification} onClose={() => setNotification("")} />

      <PageHeader
        breadcrumb="Configuración"
        breadcrumbHighlight="/ Usuarios"
        title="Administración de usuarios"
        subtitle="Gestiona los accesos a la aplicación, los roles y el estado activo de cada cuenta."
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex w-full flex-wrap items-center gap-3">
            <CardTitle icon="US" iconVariant="purple">
              Usuarios
            </CardTitle>
            <Tag>{`${activeCount} activos / ${users.length} totales`}</Tag>
          </div>
        </CardHeader>

        <TableFilters>
          <SearchField value={search} onChange={setSearch} />
        </TableFilters>

        {tableError ? (
          <div className="border-b border-[#e8c7cd] bg-[#fff3f5] px-6 py-3 text-[0.84rem] text-[#7a2237]">
            {tableError}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full rounded-none bg-transparent text-left text-sm">
            <thead className="bg-surface">
              <tr className="text-[0.75rem] uppercase tracking-[0.08em] text-text-light">
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                {localMode ? <th className="px-4 py-3 font-semibold">Contraseña</th> : null}
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr className="border-t border-border bg-white">
                  <td
                    colSpan={localMode ? 6 : 5}
                    className="px-4 py-8 text-center text-sm text-text-mid"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : null}

              {visibleUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-border odd:bg-white even:bg-surface/40"
                >
                  <td className="px-4 py-2.5">
                    {editingName?.id === user.id ? (
                      <div
                        ref={editingNameRef}
                        className="flex min-w-[20rem] items-center gap-0.5"
                      >
                        <input
                          className={`${INPUT_CLS} min-w-0 flex-1`}
                          value={editingName.value}
                          onChange={(event) =>
                            setEditingName((current) =>
                              current ? { ...current, value: event.target.value } : current
                            )
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleSaveName();
                            }
                          }}
                          maxLength={120}
                          autoFocus
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 min-w-[1.9rem] justify-center gap-0 !px-0 text-[0.68rem]"
                          onClick={handleSaveName}
                          disabled={savingNameId === user.id}
                        >
                          {savingNameId === user.id ? "..." : "OK"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 min-w-[1.65rem] justify-center gap-0 !px-0 text-[0.68rem]"
                          onClick={() => setEditingName(null)}
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <div className="flex min-w-[12rem] items-start gap-2">
                        <PencilButton
                          title="Editar nombre"
                          onClick={() => setEditingName({ id: user.id, value: user.nombre })}
                        />
                        <span className="font-medium text-navy">{user.nombre}</span>
                      </div>
                    )}
                  </td>

                  <td
                    className={[
                      "py-2.5 text-text-mid",
                      editingName?.id === user.id ? "pl-0 pr-4" : "px-4",
                    ].join(" ")}
                  >
                    {user.email}
                  </td>

                  <td className="px-4 py-2.5 w-[1%] whitespace-nowrap">
                    {editingRole?.id === user.id ? (
                      <div
                        ref={editingRoleRef}
                        className="flex min-w-[12.5rem] items-center gap-0.5"
                      >
                        <select
                          className={`${INPUT_CLS} w-[9rem] min-w-0`}
                          value={editingRole.value}
                          onChange={(event) =>
                            setEditingRole({
                              id: user.id,
                              value: event.target.value as RoleValue,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              void handleSaveRole();
                            }
                          }}
                          autoFocus
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="primary"
                          size="sm"
                          className="h-7 min-w-[1.9rem] justify-center gap-0 !px-0 text-[0.68rem]"
                          onClick={handleSaveRole}
                          disabled={savingRoleId === user.id}
                        >
                          {savingRoleId === user.id ? "..." : "OK"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 min-w-[1.65rem] justify-center gap-0 !px-0 text-[0.68rem]"
                          onClick={() => setEditingRole(null)}
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 whitespace-nowrap">
                        <PencilButton
                          title="Editar rol"
                          onClick={() => setEditingRole({ id: user.id, value: user.rol })}
                        />
                        <span className="font-medium text-navy">{formatRole(user.rol)}</span>
                      </div>
                    )}
                  </td>

                  {localMode ? (
                    <td
                      className={[
                        "w-[1%] py-2.5 whitespace-nowrap",
                        editingRole?.id === user.id ? "pl-0 pr-1" : "px-2",
                      ].join(" ")}
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        className="whitespace-nowrap px-2.5"
                        onClick={() => {
                          setResetPasswordError(null);
                          setResetPasswordState({
                            userId: user.id,
                            nombre: user.nombre,
                            password: "",
                            confirmPassword: "",
                          });
                        }}
                      >
                        Resetear contraseña
                      </Button>
                    </td>
                  ) : null}

                  <td className="px-3 py-2.5 w-[1%] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={user.activo ? "Desactivar usuario" : "Activar usuario"}
                        title={user.activo ? "Desactivar" : "Activar"}
                        onClick={() => void handleToggleActivo(user)}
                        disabled={togglingId === user.id}
                        className={[
                          "relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-200",
                          user.activo ? "bg-accent" : "bg-[#d7c7c3]",
                          togglingId === user.id ? "opacity-70" : "",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
                            user.activo ? "translate-x-5" : "translate-x-1",
                          ].join(" ")}
                        />
                      </button>
                      <span className="text-left text-[0.82rem] font-medium text-text-mid whitespace-nowrap">
                        {user.activo ? "Activado" : "Desactivado"}
                      </span>
                    </div>
                  </td>

                  <td className="pl-2 pr-4 py-2.5 w-[1%] whitespace-nowrap">
                    <div className="flex justify-end">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDeleteUser(user)}
                        disabled={deletingId === user.id}
                        title="Eliminar usuario"
                      >
                        {deletingId === user.id ? "Eliminando..." : "Eliminar"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!localMode ? (
          <div className="border-t border-border px-6 py-4 text-[0.84rem] text-text-mid">
            (Como la autenticación es externa aquí no se gestionan las contraseñas.)
          </div>
        ) : null}
      </Card>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex w-full flex-wrap items-center gap-3">
              <CardTitle icon="NU" iconVariant="blue">
                Nuevo usuario
              </CardTitle>
            </div>
          </CardHeader>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {createError ? (
              <div className="md:col-span-2 rounded-[12px] border border-[#e8c7cd] bg-[#fff3f5] px-4 py-3 text-[0.84rem] text-[#7a2237]">
                {createError}
              </div>
            ) : null}

            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Nombre *
              </span>
              <input
                className={INPUT_CLS}
                value={createForm.nombre}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, nombre: event.target.value }))
                }
                maxLength={120}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Email *
              </span>
              <input
                className={INPUT_CLS}
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, email: event.target.value }))
                }
                maxLength={160}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                Rol *
              </span>
              <select
                className={INPUT_CLS}
                value={createForm.rol}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    rol: event.target.value as RoleValue,
                  }))
                }
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>

            {localMode ? (
              <div className="grid gap-5 md:col-span-2 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                    Contraseña *
                  </span>
                  <PasswordInput
                    value={createForm.password}
                    onChange={(value) =>
                      setCreateForm((current) => ({ ...current, password: value }))
                    }
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                    Confirmar contraseña *
                  </span>
                  <PasswordInput
                    value={createForm.confirmPassword}
                    onChange={(value) =>
                      setCreateForm((current) => ({
                        ...current,
                        confirmPassword: value,
                      }))
                    }
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border bg-surface px-6 py-4">
            <Button variant="secondary" size="sm" onClick={resetCreateForm}>
              Limpiar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleCreateUser()}
              disabled={creating}
            >
              {creating ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </Card>
      </div>

      {resetPasswordState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1c20]/35 px-4">
          <div className="w-full max-w-lg rounded-[20px] border border-white/80 bg-white p-6 shadow-[0_24px_60px_rgba(43,28,32,0.24)]">
            <h2 className="font-display text-[1.35rem] font-bold text-navy">
              Resetear contraseña
            </h2>
            <p className="mt-2 text-[0.92rem] text-text-mid">
                  Define una nueva contraseña para {resetPasswordState.nombre}.
            </p>

            {resetPasswordError ? (
              <div className="mt-4 rounded-[12px] border border-[#e8c7cd] bg-[#fff3f5] px-4 py-3 text-[0.84rem] text-[#7a2237]">
                {resetPasswordError}
              </div>
            ) : null}

            <div className="mt-5 grid gap-4">
              <label className="space-y-2">
                <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Contraseña
                </span>
                <PasswordInput
                  value={resetPasswordState.password}
                  onChange={(value) =>
                    setResetPasswordState((current) =>
                      current ? { ...current, password: value } : current
                    )
                  }
                  autoFocus
                />
              </label>

              <label className="space-y-2">
                <span className="block text-[0.8rem] font-semibold uppercase tracking-[0.08em] text-text-light">
                  Confirmar contraseña
                </span>
                <PasswordInput
                  value={resetPasswordState.confirmPassword}
                  onChange={(value) =>
                    setResetPasswordState((current) =>
                      current ? { ...current, confirmPassword: value } : current
                    )
                  }
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={closeResetPasswordDialog}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => void handleResetPassword()}
                disabled={passwordResetId === resetPasswordState.userId}
              >
                {passwordResetId === resetPasswordState.userId ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
