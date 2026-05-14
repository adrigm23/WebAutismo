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

export function isProductionEnv() {
  return process.env.NODE_ENV === "production";
}

export function isHostedDeploymentEnv() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV?.trim());
}

export function isDemoAuthEnabled() {
  return (
    !isProductionEnv() &&
    !isHostedDeploymentEnv() &&
    getBooleanEnv("DEMO_AUTH_ENABLED", false) &&
    getBooleanEnv("ALLOW_DEMO_AUTH", false)
  );
}

export function isLegacyCatalogFallbackEnabled() {
  return !isProductionEnv() && getBooleanEnv("LEGACY_CATALOG_FALLBACK_ENABLED", false);
}

export function getObjectStorageProviderEnv() {
  const provider = process.env.OBJECT_STORAGE_PROVIDER?.trim().toLowerCase();

  if (provider === "vercel-blob" || provider === "filesystem" || provider === "database") {
    return provider;
  }

  return null;
}

export function isDatabaseStorageFallbackAllowed() {
  return getBooleanEnv("ALLOW_DATABASE_STORAGE_FALLBACK", false);
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

export function getSiteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!value) {
    if (isProductionEnv()) {
      throw new Error("NEXT_PUBLIC_SITE_URL is required in production.");
    }

    return "http://localhost:3000";
  }

  return value.replace(/\/$/, "");
}
