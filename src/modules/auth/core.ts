import { createHash, createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { AUTH_COOKIE_NAME, SESSION_TTL_SECONDS } from "@/modules/auth/config";

const scrypt = promisify(nodeScrypt);

const PASSWORD_KEY_LENGTH = 64;
const SESSION_TOKEN_BYTES = 32;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-auth-secret-change-me";
  }

  throw new Error("AUTH_SECRET no esta configurado.");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function deriveInitials(nombre: string, email?: string) {
  const source = nombre.trim();
  if (source) {
    const initials = source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("");

    if (initials) {
      return initials;
    }
  }

  return email ? normalizeEmail(email).slice(0, 2).toUpperCase() : "US";
}

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return `${toBase64Url(salt)}:${toBase64Url(derived)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [saltEncoded, hashEncoded] = storedHash.split(":");

  if (!saltEncoded || !hashEncoded) {
    return false;
  }

  const salt = fromBase64Url(saltEncoded);
  const expectedHash = fromBase64Url(hashEncoded);
  const derived = (await scrypt(password, salt, expectedHash.length)) as Buffer;

  if (derived.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(derived, expectedHash);
}

export function generateSessionToken() {
  return toBase64Url(randomBytes(SESSION_TOKEN_BYTES));
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function signSessionToken(token: string) {
  return createHmac("sha256", getAuthSecret()).update(token).digest("base64url");
}

export function buildSignedSessionValue(token: string) {
  return `${token}.${signSessionToken(token)}`;
}

export function verifySignedSessionValue(value: string | undefined | null) {
  if (!value) {
    return null;
  }

  const [token, signature] = value.split(".");
  if (!token || !signature) {
    return null;
  }

  const expected = signSessionToken(token);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  return token;
}

export function getSessionExpirationDate() {
  return new Date(Date.now() + SESSION_TTL_MS);
}
