import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const webDir = join(root, "apps", "web");
const workerDir = join(root, "apps", "worker");
const webCli = join(webDir, "node_modules", "next", "dist", "bin", "next");
const workerCli = join(workerDir, "node_modules", "tsx", "dist", "cli.mjs");
const requiredFiles = [
  [join(webDir, ".env.local"), "apps/web/.env.local"],
  [join(workerDir, ".env.local"), "apps/worker/.env.local"],
  [webCli, "web dependencies"],
  [workerCli, "worker dependencies"],
];

const missing = requiredFiles.filter(([path]) => !existsSync(path)).map(([, label]) => label);
if (missing.length) {
  process.stderr.write(`Local demo needs ${missing.join(", ")}. Add the local environment files and run pnpm install before starting it.\n`);
  process.exit(1);
}

if (process.argv.includes("--check")) {
  process.stdout.write("Local demo files are ready. This check did not start either process.\n");
  process.exit(0);
}

let stopping = false;
let resultCode = 0;
const children = [];

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  resultCode = code;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(resultCode), 12_000).unref();
}

function start(label, args, cwd) {
  const child = spawn(process.execPath, args, { cwd, stdio: "inherit", env: process.env });
  children.push(child);
  child.on("error", error => {
    process.stderr.write(`${label} could not start: ${error.message}\n`);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (!stopping) {
      process.stderr.write(`${label} stopped (${signal ?? `exit ${code}`}); stopping the local demo.\n`);
      stop(code || 1);
    }
    if (children.every(process => process.exitCode !== null || process.signalCode !== null)) {
      process.exitCode = resultCode;
    }
  });
  return child;
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

process.stdout.write("Starting AccessPath at http://localhost:3000 with its local scan worker. Press Ctrl+C to stop both.\n");
start("Website", [webCli, "dev", "-p", "3000"], webDir);
start("Worker", ["--env-file=.env.local", workerCli, "src/index.ts"], workerDir);
