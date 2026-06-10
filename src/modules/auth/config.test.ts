import { afterEach, describe, expect, it, vi } from "vitest";
import { shouldUseSecureAuthCookies } from "@/modules/auth/config";

describe("auth cookie security configuration", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("usa cookies Secure por defecto en produccion", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_SECURE", "");

    expect(shouldUseSecureAuthCookies()).toBe(true);
  });

  it("permite desactivar cookies Secure para despliegues HTTP explicitos", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_SECURE", "0");

    expect(shouldUseSecureAuthCookies()).toBe(false);
  });

  it("permite activar cookies Secure explicitamente fuera de produccion", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("AUTH_COOKIE_SECURE", "true");

    expect(shouldUseSecureAuthCookies()).toBe(true);
  });
});
