type LogLevel = "debug" | "info" | "warn" | "error";

type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | Error
  | LogValue[]
  | { [key: string]: LogValue };

export type LogContext = Record<string, LogValue>;

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

function resolveLogLevel(): LogLevel {
  const rawValue = process.env.LOG_LEVEL?.trim().toLowerCase();

  if (rawValue === "debug" || rawValue === "info" || rawValue === "warn" || rawValue === "error") {
    return rawValue;
  }

  return process.env.NODE_ENV === "development" ? "debug" : "info";
}

function normalizeLogValue(value: LogValue): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null
    };
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeLogValue(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeLogValue(nestedValue as LogValue)])
    );
  }

  return value ?? null;
}

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[resolveLogLevel()];
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = {
    level,
    message,
    service: "academy-autismo",
    environment: process.env.NODE_ENV ?? "development",
    timestamp: new Date().toISOString(),
    ...Object.fromEntries(
      Object.entries(context ?? {}).map(([key, value]) => [key, normalizeLogValue(value)])
    )
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  if (level === "info") {
    console.info(serialized);
    return;
  }

  console.debug(serialized);
}

export function createLogger(baseContext?: LogContext) {
  return {
    debug(message: string, context?: LogContext) {
      writeLog("debug", message, { ...baseContext, ...context });
    },
    info(message: string, context?: LogContext) {
      writeLog("info", message, { ...baseContext, ...context });
    },
    warn(message: string, context?: LogContext) {
      writeLog("warn", message, { ...baseContext, ...context });
    },
    error(message: string, context?: LogContext) {
      writeLog("error", message, { ...baseContext, ...context });
    },
    child(context: LogContext) {
      return createLogger({ ...baseContext, ...context });
    }
  };
}

export const logger = createLogger();
