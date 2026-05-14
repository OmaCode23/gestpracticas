import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readAppFile(relativePath: string) {
  return readFileSync(path.resolve("src/app", relativePath), "utf8");
}

describe("app access contracts", () => {
  it("redirige al alumno autenticado hacia portal-alumno desde login", () => {
    const source = readAppFile("login/page.tsx");

    expect(source).toContain('isAlumnoRole(session.user.rol)');
    expect(source).toContain('? "/portal-alumno"');
  });

  it("protege el dashboard del panel interno con requireStaffSession", () => {
    const source = readAppFile("page.tsx");

    expect(source).toContain('requireStaffSession("/")');
    expect(source).not.toContain('requireUserSession("/")');
  });

  it("protege el modulo de empresas con requireStaffSession", () => {
    const source = readAppFile("empresas/page.tsx");

    expect(source).toContain('requireStaffSession("/empresas")');
    expect(source).not.toContain('requireUserSession("/empresas")');
  });
});
