export const AUTH_COOKIE_NAME = "gestpracticas_session";
export const EXTERNAL_AUTH_STATE_COOKIE_NAME = "gestpracticas_external_state";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
export const EXTERNAL_AUTH_STATE_TTL_SECONDS = 60 * 10;

export type AuthMode = "local" | "external";

export function getAuthMode(): AuthMode {
  const raw = process.env.AUTH_MODE?.trim().toLowerCase();

  if (raw === "external") {
    return "external";
  }

  return "local";
}

export function isLocalAuthMode() {
  return getAuthMode() === "local";
}

export function isExternalAuthMode() {
  return getAuthMode() === "external";
}

export type ExternalAuthSettings = {
  authorizeUrl: string;
  clientId: string;
  redirectUri: string;
  scope: string;
};

export function getExternalAuthSettings(): ExternalAuthSettings | null {
  const authorizeUrl = process.env.EXTERNAL_AUTH_AUTHORIZE_URL?.trim();
  const clientId = process.env.EXTERNAL_AUTH_CLIENT_ID?.trim();
  const redirectUri = process.env.EXTERNAL_AUTH_REDIRECT_URI?.trim();
  const scope = process.env.EXTERNAL_AUTH_SCOPE?.trim() || "openid profile email";

  if (!authorizeUrl || !clientId || !redirectUri) {
    return null;
  }

  return {
    authorizeUrl,
    clientId,
    redirectUri,
    scope,
  };
}

export function isExternalMockCallbackEnabled() {
  return process.env.EXTERNAL_AUTH_ALLOW_MOCK_CALLBACK?.trim() === "1";
}
