import {
  getObjectStorageProviderEnv,
  hasEnv,
  isHostedDeploymentEnv,
  isLocalDevelopmentEnv
} from "@/lib/env";
import { getObjectStorageProvider } from "@/lib/object-storage";
import { getDb } from "@/lib/prisma";
import { getStripeRuntimeState } from "@/lib/stripe";

type ReadinessCheck =
  | {
      ok: true;
      details?: Record<string, unknown>;
    }
  | {
      ok: false;
      reason: string;
      details?: Record<string, unknown>;
    };

function buildOkCheck(details?: Record<string, unknown>): ReadinessCheck {
  return {
    ok: true,
    details
  };
}

function buildFailedCheck(reason: string, details?: Record<string, unknown>): ReadinessCheck {
  return {
    ok: false,
    reason,
    details
  };
}

async function checkDatabaseReadiness() {
  try {
    await getDb().$queryRaw`SELECT 1`;
    return buildOkCheck();
  } catch {
    return buildFailedCheck("database-unreachable");
  }
}

function isLocalHostname(value: string) {
  return value === "localhost" || value === "127.0.0.1" || value === "::1";
}

function canUseImplicitDatabaseStorageReadiness() {
  if (isLocalDevelopmentEnv()) {
    return true;
  }

  if (isHostedDeploymentEnv()) {
    return false;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return false;
  }

  try {
    return isLocalHostname(new URL(siteUrl).hostname);
  } catch {
    return false;
  }
}

function checkStorageReadiness() {
  const configuredProvider = getObjectStorageProviderEnv();
  const effectiveProvider = getObjectStorageProvider();

  if (!configuredProvider) {
    if (effectiveProvider === "database" && canUseImplicitDatabaseStorageReadiness()) {
      return buildOkCheck({
        configuredProvider: null,
        effectiveProvider,
        mode: "implicit-local-database-fallback",
        warning: "Set OBJECT_STORAGE_PROVIDER explicitly in deployed environments."
      });
    }

    return buildFailedCheck("storage-provider-not-explicit", {
      effectiveProvider,
      requiredInDeployedEnvironments: true
    });
  }

  if (configuredProvider === "vercel-blob" && !hasEnv("BLOB_READ_WRITE_TOKEN")) {
    return buildFailedCheck("blob-token-missing", {
      configuredProvider
    });
  }

  return buildOkCheck({
    configuredProvider,
    effectiveProvider
  });
}

function checkSessionRuntimeReadiness() {
  const hasSessionSecret = hasEnv("SESSION_SECRET");
  const hasSiteUrl = hasEnv("NEXT_PUBLIC_SITE_URL");

  if (!hasSessionSecret || !hasSiteUrl) {
    return buildFailedCheck("session-runtime-config-missing", {
      hasSessionSecret,
      hasSiteUrl
    });
  }

  return buildOkCheck({
    hasSessionSecret,
    hasSiteUrl
  });
}

function checkStripeReadiness() {
  const stripeState = getStripeRuntimeState();

  if (stripeState.mode === "misconfigured") {
    return buildFailedCheck("stripe-webhook-secret-missing", {
      mode: stripeState.mode,
      hasSecretKey: stripeState.hasSecretKey,
      hasWebhookSecret: stripeState.hasWebhookSecret
    });
  }

  if (stripeState.mode === "disabled") {
    return buildOkCheck({
      mode: stripeState.mode,
      enabled: false
    });
  }

  return buildOkCheck({
    mode: stripeState.mode,
    enabled: true
  });
}

export async function getReadinessReport() {
  const [database, storage, session, stripe] = await Promise.all([
    checkDatabaseReadiness(),
    Promise.resolve(checkStorageReadiness()),
    Promise.resolve(checkSessionRuntimeReadiness()),
    Promise.resolve(checkStripeReadiness())
  ]);

  const ok = database.ok && storage.ok && session.ok && stripe.ok;

  return {
    ok,
    status: ok ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks: {
      database,
      storage,
      session,
      stripe
    }
  };
}
