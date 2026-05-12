import { spawn, spawnSync } from "node:child_process";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const inheritedEnv = {
  ...process.env,
  E2E_BASE_URL: baseUrl,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? baseUrl,
  LEGACY_CATALOG_FALLBACK_ENABLED:
    process.env.LEGACY_CATALOG_FALLBACK_ENABLED ?? "true"
};

async function waitForServer(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        redirect: "manual"
      });

      if (response.ok || response.status === 307 || response.status === 308) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function runCommand(command: string, args: string[], env = inheritedEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      env
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });

    child.on("error", reject);
  });
}

function stopServer(pid: number) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore"
    });
    return;
  }

  process.kill(pid, "SIGTERM");
}

function waitForExit(child: ReturnType<typeof spawn>) {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }

    child.once("exit", () => resolve());
  });
}

async function main() {
  if (process.env.E2E_BASE_URL) {
    await runCommand("npx.cmd", ["playwright", "test"], inheritedEnv);
    return;
  }

  await runCommand("npm.cmd", ["run", "build"], inheritedEnv);

  const server = spawn("npm.cmd", ["run", "start"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: inheritedEnv
  });

  try {
    await waitForServer(baseUrl, 60_000);
    await runCommand("npx.cmd", ["playwright", "test"], inheritedEnv);
  } finally {
    if (server.exitCode === null && server.pid) {
      stopServer(server.pid!);
    }

    server.unref();
    await waitForExit(server);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
