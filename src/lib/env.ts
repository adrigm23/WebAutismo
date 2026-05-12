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
  return !isHostedDeploymentEnv() && getBooleanEnv("DEMO_AUTH_ENABLED", false);
}

export function isLegacyCatalogFallbackEnabled() {
  return getBooleanEnv("LEGACY_CATALOG_FALLBACK_ENABLED", false);
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
