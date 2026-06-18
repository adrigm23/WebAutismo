/**
 * Next.js instrumentation hook — runs once at server startup before any request.
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  // Only run security assertions on the Node.js runtime (not edge workers).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertNoDemoFlagsInHostedEnv, assertRequiredProductionSecrets } = await import("@/lib/env");
    assertRequiredProductionSecrets();
    assertNoDemoFlagsInHostedEnv();
  }
}
