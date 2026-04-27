import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { ensureDatabaseEnv } from "./runtime-env.mjs";

const [command, ...args] = process.argv.slice(2);
const require = createRequire(import.meta.url);

if (!command) {
  console.error("Usage: node scripts/with-db-env.mjs <command> [...args]");
  process.exit(1);
}

ensureDatabaseEnv();

function resolveCommand() {
  if (command === "node") {
    return { command: process.execPath, args };
  }

  if (command === "prisma") {
    return {
      command: process.execPath,
      args: [require.resolve("prisma/build/index.js"), ...args],
    };
  }

  if (command === "next") {
    return {
      command: process.execPath,
      args: [require.resolve("next/dist/bin/next"), ...args],
    };
  }

  return {
    command,
    args,
    shell: process.platform === "win32",
  };
}

const resolved = resolveCommand();

const child = spawn(resolved.command, resolved.args, {
  env: process.env,
  shell: resolved.shell ?? false,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
