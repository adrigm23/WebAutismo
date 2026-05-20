import { hasEnv, getObjectStorageProviderEnv } from "@/lib/env";
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

function checkStorageReadiness() {
  const configuredProvider = getObjectStorageProviderEnv();
  const effectiveProvider = getObjectStorageProvider();

  if (!configuredProvider) {
    return buildFailedCheck("storage-provider-not-explicit", {
      effectiveProvider
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
