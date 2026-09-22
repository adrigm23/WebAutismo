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

const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start the Next.js server:", error);
    process.exit(1);
  });
