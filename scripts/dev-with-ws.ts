import { spawn, type ChildProcess } from "node:child_process";

const children: ChildProcess[] = [];

function run(command: string, args: string[], label: string) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev] ${label} exited with code ${code}`);
    }
    shutdown();
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.info("[dev] starting Next.js + Gmail WebSocket server…");
run("pnpm", ["dev:next"], "next");
run("tsx", ["ws-server.ts"], "gmail-ws");
