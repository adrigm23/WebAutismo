import { NextResponse } from "next/server";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { captureServerException, normalizeClientErrorPayload } from "@/lib/monitoring";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const requestLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(request.headers),
    route: "/api/monitoring/client-errors",
    action: "client-error-report"
  });

  try {
    const rateLimit = await consumeRateLimit({
      bucket: "client-errors",
      key: buildRequestFingerprint(request.headers),
      limit: 20,
      windowMs: 5 * 60 * 1_000
    });

    if (!rateLimit.allowed) {
      requestLogger.warn("Client error report rate limited.", {
        result: "rate-limited"
      });
      return NextResponse.json(
        {
          ok: false,
          error: "rate_limited"
        },
        {
          status: 429,
          headers: {
            "retry-after": String(rateLimit.retryAfterSeconds)
          }
        }
      );
    }

    const payload = normalizeClientErrorPayload(await request.json());

    captureServerException(new Error(payload.message), {
      source: "client-error",
      errorName: payload.name,
      digest: payload.digest,
      pathname: payload.pathname,
      userAgent: payload.userAgent,
      stack: payload.stack
    });

    return NextResponse.json({
      ok: true
    });
  } catch (error) {
    captureServerException(error, {
      source: "client-error-route"
    });

    return NextResponse.json(
      {
        ok: false
      },
      {
        status: 500
      }
    );
  }
}
