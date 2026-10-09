import {
  hasEnv,
} from "@/lib/env";
import { getObjectStorageWriteReadiness } from "@/lib/object-storage";
import { getDb } from "@/lib/prisma";
import { getRedsysRuntimeState } from "@/lib/redsys";
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
  } catch (error) {
    console.error("[readiness] database check failed:", error);
    return buildFailedCheck("database-unreachable");
  }
}

function checkStorageReadiness() {
  const readiness = getObjectStorageWriteReadiness();

  if (readiness.ok) {
    return buildOkCheck({
      configuredProvider: readiness.configuredProvider,
      effectiveProvider: readiness.effectiveProvider,
      ...(readiness.mode === "implicit-local-database-fallback"
        ? {
            mode: readiness.mode,
            warning: "Set OBJECT_STORAGE_PROVIDER explicitly in deployed environments."
          }
        : {})
    });
  }

  return buildFailedCheck(readiness.reason, {
    configuredProvider: readiness.configuredProvider,
    effectiveProvider: readiness.effectiveProvider,
    ...(readiness.reason === "storage-provider-not-explicit"
      ? {
          requiredInDeployedEnvironments: true
        }
      : {})
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

function checkRedsysReadiness() {
  const redsysState = getRedsysRuntimeState();

  if (redsysState.mode === "misconfigured") {
    return buildFailedCheck(`redsys-${redsysState.reason}`, {
      mode: redsysState.mode,
      environment: redsysState.environment
    });
  }

  if (redsysState.mode === "disabled") {
    return buildOkCheck({
      mode: redsysState.mode,
      enabled: false
    });
  }

  return buildOkCheck({
    mode: redsysState.mode,
    enabled: true,
    environment: redsysState.environment
  });
}

export async function getReadinessReport() {
  const [database, storage, session, stripe, redsys] = await Promise.all([
    checkDatabaseReadiness(),
    Promise.resolve(checkStorageReadiness()),
    Promise.resolve(checkSessionRuntimeReadiness()),
    Promise.resolve(checkStripeReadiness()),
    Promise.resolve(checkRedsysReadiness())
  ]);

  const ok = database.ok && storage.ok && session.ok && stripe.ok && redsys.ok;

  return {
    ok,
    status: ok ? "ready" : "not_ready",
    timestamp: new Date().toISOString(),
    checks: {
      database,
      storage,
      session,
      stripe,
      redsys
    }
  };
}
