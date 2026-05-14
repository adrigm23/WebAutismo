import { logger, type LogContext } from "@/lib/logger";

export function captureServerException(error: unknown, context?: LogContext) {
  logger.error("Unhandled server exception", {
    ...context,
    error: error instanceof Error ? error : new Error(String(error))
  });
}

export function captureOperationalWarning(message: string, context?: LogContext) {
  logger.warn(message, context);
}

export function captureOperationalInfo(message: string, context?: LogContext) {
  logger.info(message, context);
}

export function normalizeClientErrorPayload(payload: {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
  digest?: unknown;
  pathname?: unknown;
  userAgent?: unknown;
}) {
  return {
    name: typeof payload.name === "string" ? payload.name : "Error",
    message: typeof payload.message === "string" ? payload.message : "Client-side error",
    stack: typeof payload.stack === "string" ? payload.stack : null,
    digest: typeof payload.digest === "string" ? payload.digest : null,
    pathname: typeof payload.pathname === "string" ? payload.pathname : null,
    userAgent: typeof payload.userAgent === "string" ? payload.userAgent : null
  };
}
