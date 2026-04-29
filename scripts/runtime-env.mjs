import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function parseDotEnvValue(rawValue) {
  const value = rawValue.trim();
  const quote = value[0];

  if ((quote === '"' || quote === "'") && value[value.length - 1] === quote) {
    const unquoted = value.slice(1, -1);
    return quote === '"' ? unquoted.replaceAll("\\n", "\n") : unquoted;
  }

  return value;
}

function loadDotEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseDotEnvValue(trimmed.slice(separator + 1));
  }
}

export function loadRuntimeEnv(mode = process.env.NODE_ENV || "development") {
  const files = [
    `.env.${mode}.local`,
    ".env.local",
    `.env.${mode}`,
    ".env",
  ];

  for (const file of files) {
    loadDotEnvFile(resolve(process.cwd(), file));
  }
}

function isRunningInContainer() {
  return (
    process.env.RUNNING_IN_DOCKER === "1" ||
    process.env.DOCKER === "1" ||
    existsSync("/.dockerenv")
  );
}

function present(value) {
  return typeof value === "string" && value.trim() !== "";
}

function buildPostgresUrl({ host, port, database, user, password, params }) {
  const auth = `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;
  const query = new URLSearchParams(params);

  return `postgresql://${auth}@${host}:${port}/${encodeURIComponent(database)}?${query.toString()}`;
}

export function ensureDatabaseEnv({ mode } = {}) {
  loadRuntimeEnv(mode);

  const inContainer = isRunningInContainer();
  const database = process.env.POSTGRES_DB || "gestpracticas";
  const user = process.env.POSTGRES_USER || "gestpracticas";
  const password = process.env.POSTGRES_PASSWORD || "change-this-super-long-password";
  const schema = process.env.POSTGRES_SCHEMA || "public";

  const postgresHost = process.env.POSTGRES_HOST || (inContainer ? "db" : "127.0.0.1");
  const postgresPort = inContainer
    ? process.env.POSTGRES_PORT || "5432"
    : process.env.POSTGRES_HOST_PORT || process.env.POSTGRES_PORT || "5432";

  const pgbouncerHost = process.env.PGBOUNCER_HOST || (inContainer ? "pgbouncer" : "127.0.0.1");
  const pgbouncerPort = inContainer
    ? process.env.PGBOUNCER_PORT || "6432"
    : process.env.PGBOUNCER_HOST_PORT || process.env.PGBOUNCER_PORT || "6432";
  const usePgbouncer = inContainer || process.env.LOCAL_USE_PGBOUNCER === "1";

  if (!present(process.env.DATABASE_URL)) {
    process.env.DATABASE_URL = usePgbouncer
      ? buildPostgresUrl({
          host: pgbouncerHost,
          port: pgbouncerPort,
          database,
          user,
          password,
          params: {
            schema,
            pgbouncer: "true",
            connection_limit: process.env.PRISMA_CONNECTION_LIMIT || "10",
            pool_timeout: process.env.PRISMA_POOL_TIMEOUT || "20",
          },
        })
      : buildPostgresUrl({
          host: postgresHost,
          port: postgresPort,
          database,
          user,
          password,
          params: { schema },
        });
  }

  if (!present(process.env.DIRECT_URL)) {
    process.env.DIRECT_URL = buildPostgresUrl({
      host: postgresHost,
      port: postgresPort,
      database,
      user,
      password,
      params: { schema },
    });
  }
}
