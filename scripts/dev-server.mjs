import { createRequire } from "node:module";
import { ensureDatabaseEnv } from "./runtime-env.mjs";

process.env.NODE_ENV ||= "development";
process.env.NEXT_TELEMETRY_DISABLED ||= "1";

if (process.env.DEBUG === "release") {
  delete process.env.DEBUG;
}

const require = createRequire(import.meta.url);
const { startServer } = require("next/dist/server/lib/start-server");

function readOption(args, names) {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    for (const name of names) {
      if (arg === name) {
        return args[index + 1];
      }

      if (arg.startsWith(`${name}=`)) {
        return arg.slice(name.length + 1);
      }
    }
  }

  return undefined;
}

function readPort(args) {
  const value = readOption(args, ["-p", "--port"]) || process.env.PORT || process.env.APP_PORT || "3000";
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error(`Invalid port: ${value}`);
    process.exit(1);
  }

  return port;
}

const args = process.argv.slice(2);

if (args.includes("--turbo")) {
  process.env.TURBOPACK = "1";
}

ensureDatabaseEnv({ mode: "development" });

const port = readPort(args);
const hostname = readOption(args, ["-H", "--hostname"]) || process.env.HOST || "0.0.0.0";

startServer({
  dir: process.cwd(),
  isDev: true,
  hostname,
  port,
  allowRetry: true,
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
