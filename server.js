/**
 * Custom Node.js entry point for cPanel's "Setup Node.js App" (Phusion Passenger).
 *
 * Passenger does not run `npm run start` / `next start` directly — it expects the
 * "Application startup file" to be a plain Node.js script that creates and starts
 * an HTTP server itself. This wraps Next.js's own production server with the
 * programmatic API Next.js documents for custom servers, and listens on the port
 * Passenger assigns via the PORT env var (falling back to 3000 for local testing).
 *
 * This does NOT replace `next start` for other environments (Vercel, plain
 * `next start` on a VPS) — both keep working exactly as before. This file is only
 * ever used when cPanel points its Node.js App at it.
 */
const { createServer } = require("node:http");
const next = require("next");

// Not process.env.HOSTNAME: Docker/Passenger set that to the container or
// process name, not an address to bind to, which stops the server listening.
const port = Number(process.env.PORT) || 3000;
const hostname = "0.0.0.0";

// How long in-flight requests get to finish after a stop signal before the
// process exits anyway.
const SHUTDOWN_GRACE_MS = 10_000;

const app = next({ dev: false });
const handle = app.getRequestHandler();
let server = null;
let shuttingDown = false;

// The hosting panel stops or restarts the app with SIGTERM. Without a handler
// the old process never exited: each restart left another copy running, and
// two copies (~50 processes each) filled the account's 100-process limit and
// took the whole hosting account down.
function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`> ${signal} received, shutting down`);

  const forceExit = setTimeout(() => {
    console.error("> Graceful shutdown timed out, forcing exit");
    process.exit(0);
  }, SHUTDOWN_GRACE_MS);
  forceExit.unref();

  if (!server) {
    process.exit(0);
  }

  server.close(() => process.exit(0));
  // Idle keep-alive sockets would otherwise hold close() open until they time out.
  server.closeIdleConnections();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

app
  .prepare()
  .then(() => {
    if (shuttingDown) {
      process.exit(0);
    }

    server = createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start the Next.js server:", error);
    process.exit(1);
  });
