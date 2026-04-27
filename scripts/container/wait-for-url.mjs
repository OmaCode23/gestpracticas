import net from "node:net";

const [envName, timeoutArg = "90"] = process.argv.slice(2);

if (!envName) {
  console.error("Usage: node scripts/container/wait-for-url.mjs <ENV_NAME> [timeoutSeconds]");
  process.exit(1);
}

const rawUrl = process.env[envName];

if (!rawUrl) {
  console.error(`Environment variable ${envName} is not set`);
  process.exit(1);
}

const timeoutMs = Number(timeoutArg) * 1000;
const deadline = Date.now() + timeoutMs;
const url = new URL(rawUrl);
const host = url.hostname;
const port = Number(url.port || (url.protocol === "postgresql:" ? 5432 : 0));

if (!host || !port) {
  console.error(`Could not parse host/port from ${envName}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function canConnect() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.setTimeout(2000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

while (Date.now() < deadline) {
  if (await canConnect()) {
    console.log(`${envName} is reachable at ${host}:${port}`);
    process.exit(0);
  }

  console.log(`Waiting for ${envName} at ${host}:${port}...`);
  await sleep(2000);
}

console.error(`Timed out waiting for ${envName} at ${host}:${port}`);
process.exit(1);
