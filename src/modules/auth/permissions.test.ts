import { describe, expect, it } from "vitest";
import {
  canImportExcel,
  canManageAcademicSettings,
  canManageCatalogs,
  canManageUsers,
  isAdminRole,
} from "@/modules/auth/permissions";

describe("auth permissions", () => {
  it("identifica correctamente al rol administrador", () => {
    expect(isAdminRole("ADMIN")).toBe(true);
    expect(isAdminRole("PROFESOR")).toBe(false);
    expect(isAdminRole("ALUMNO")).toBe(false);
  });

  it("reserva la gestion de usuarios al administrador", () => {
    expect(canManageUsers("ADMIN")).toBe(true);
    expect(canManageUsers("PROFESOR")).toBe(false);
    expect(canManageUsers("ALUMNO")).toBe(false);
  });

  it("reserva la importacion Excel al administrador", () => {
    expect(canImportExcel("ADMIN")).toBe(true);
    expect(canImportExcel("PROFESOR")).toBe(false);
    expect(canImportExcel("ALUMNO")).toBe(false);
  });

  it("reserva configuracion y catalogos al administrador", () => {
    expect(canManageCatalogs("ADMIN")).toBe(true);
    expect(canManageAcademicSettings("ADMIN")).toBe(true);
    expect(canManageCatalogs("PROFESOR")).toBe(false);
    expect(canManageAcademicSettings("PROFESOR")).toBe(false);
  });
});
