import type { UserRole } from "@prisma/client";

export function isAdminRole(role: UserRole) {
  return role === "ADMIN";
}

export function isAlumnoRole(role: UserRole) {
  return role === "ALUMNO";
}

export function canManageUsers(role: UserRole) {
  return isAdminRole(role);
}

export function canImportExcel(role: UserRole) {
  return isAdminRole(role);
}

export function canManageCatalogs(role: UserRole) {
  return isAdminRole(role);
}

export function canManageAcademicSettings(role: UserRole) {
  return isAdminRole(role);
}
