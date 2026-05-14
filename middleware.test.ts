import { describe, expect, it } from "vitest";
import { buildSignedSessionValue } from "@/modules/auth/core";
import { AUTH_COOKIE_NAME } from "@/modules/auth/config";
import { middleware } from "./middleware";

function buildRequest(pathname: string, options?: { search?: string; cookieValue?: string }) {
  const search = options?.search ?? "";
  const cookieValue = options?.cookieValue;

  return {
    url: `https://example.com${pathname}${search}`,
    nextUrl: {
      pathname,
      search,
    },
    cookies: {
      get(name: string) {
        if (name !== AUTH_COOKIE_NAME || !cookieValue) {
          return undefined;
        }

        return { value: cookieValue };
      },
    },
  } as any;
}

describe("middleware auth protection", () => {
  it("permite acceder a /login aunque exista una cookie firmada valida", async () => {
    const response = await middleware(
      buildRequest("/login", {
        cookieValue: buildSignedSessionValue("valid-token"),
      })
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("limpia la cookie si /login recibe una cookie invalida", async () => {
    const response = await middleware(
      buildRequest("/login", {
        cookieValue: "token.firma-invalida",
      })
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("set-cookie")).toContain(`${AUTH_COOKIE_NAME}=;`);
  });

  it("redirige a /login y limpia la cookie invalida en rutas privadas", async () => {
    const response = await middleware(
      buildRequest("/portal-alumno", {
        search: "?tab=empresas",
        cookieValue: "token.firma-invalida",
      })
    );

    expect(response.headers.get("location")).toBe(
      "https://example.com/login?next=%2Fportal-alumno%3Ftab%3Dempresas"
    );
    expect(response.headers.get("set-cookie")).toContain(`${AUTH_COOKIE_NAME}=;`);
  });

  it("devuelve 401 en API privada y limpia la cookie invalida", async () => {
    const response = await middleware(
      buildRequest("/api/alumnos", {
        cookieValue: "token.firma-invalida",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({
      ok: false,
      error: "No autenticado.",
    });
    expect(response.headers.get("set-cookie")).toContain(`${AUTH_COOKIE_NAME}=;`);
  });
});
