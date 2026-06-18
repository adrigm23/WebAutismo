const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getBooleanEnv(name: string, fallback = false) {
  const value = process.env[name]?.trim().toLowerCase();

  if (!value) {
    return fallback;
  }

  return TRUE_VALUES.has(value);
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function isHostedDeploymentEnv() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV?.trim());
}

export function isDevelopmentRuntime() {
  return !isProductionRuntime() && !isHostedDeploymentEnv();
}

export function isDemoRuntimeEnabled(flagName: string) {
  return isDevelopmentRuntime() && getBooleanEnv(flagName, false);
}

export function isProductionEnv() {
  return isProductionRuntime();
}

export function isLocalDevelopmentEnv() {
  return isDevelopmentRuntime();
}

export function isDemoAuthEnabled() {
  return isDemoRuntimeEnabled("DEMO_AUTH_ENABLED") && getBooleanEnv("ALLOW_DEMO_AUTH", false);
}

/**
 * Call at server startup to fail fast if critical auth secrets are missing.
 * Only enforced in hosted/production deployments.
 */
export function assertRequiredProductionSecrets() {
  if (!isHostedDeploymentEnv()) return;
  const required = ["SESSION_SECRET", "DATABASE_URL", "NEXT_PUBLIC_SITE_URL"];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(", ")}. ` +
        `Configure these in your deployment environment before starting the server.`,
    );
  }
}

/**
 * Call at server startup (e.g. instrumentation.ts) to catch misconfigured staging
 * boxes that accidentally expose demo credentials on a public hostname.
 */
export function assertNoDemoFlagsInHostedEnv() {
  if (!isHostedDeploymentEnv()) return;

  const dangerousFlags = [
    "DEMO_AUTH_ENABLED",
    "ALLOW_DEMO_AUTH",
    "ALLOW_DEVELOPMENT_DEMO_PURCHASES",
  ];

  const enabled = dangerousFlags.filter((f) => getBooleanEnv(f, false));

  if (enabled.length > 0) {
    throw new Error(
      `[security] Demo flags must never be enabled in a hosted deployment. ` +
        `Detected: ${enabled.join(", ")}. Remove these from your production environment variables.`,
    );
  }
}

export function isLegacyCatalogFallbackEnabled() {
  return isDemoRuntimeEnabled("LEGACY_CATALOG_FALLBACK_ENABLED");
}

export function isForumDemoFallbackEnabled() {
  return isDemoRuntimeEnabled("FORUM_DEMO_FALLBACK_ENABLED");
}

export function isDevelopmentDemoPurchaseEnabled() {
  return isDemoRuntimeEnabled("ALLOW_DEVELOPMENT_DEMO_PURCHASES");
}

export function isBootstrapAdminByEmailEnabled() {
  return getBooleanEnv("ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL", false);
}

export function getObjectStorageProviderEnv() {
  const provider = process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase();

  if (provider === "vercel-blob" || provider === "filesystem" || provider === "database") {
    return provider;
  }

  return null;
}

export function isDatabaseStorageFallbackAllowed() {
  return isDemoRuntimeEnabled("ALLOW_DATABASE_STORAGE_FALLBACK");
}

export function getRateLimitBackendEnv() {
  const backend = process.env.RATE_LIMIT_BACKEND?.trim().toLowerCase();

  if (backend === "database" || backend === "memory") {
    return backend;
  }

  return null;
}

export function canUseMemoryRateLimitFallback() {
  return isDemoRuntimeEnabled("ALLOW_MEMORY_RATE_LIMIT_FALLBACK");
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const rawValue = process.env[name]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

export function isEmailVerificationRequired() {
  return getBooleanEnv("EMAIL_VERIFICATION_REQUIRED", false);
}

export function getPasswordResetTokenTtlMinutes() {
  return getPositiveIntegerEnv("PASSWORD_RESET_TOKEN_TTL_MINUTES", 60);
}

export function getEmailVerificationTokenTtlHours() {
  return getPositiveIntegerEnv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", 48);
}

export function getSessionTtlDays() {
  return getPositiveIntegerEnv("SESSION_TTL_DAYS", 30);
}

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!value) {
    if (isProductionRuntime()) {
      throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
    }

    return "http://localhost:3000";
  }

  return value.replace(/\/$/, "");
}
