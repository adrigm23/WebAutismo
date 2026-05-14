import { NextResponse } from "next/server";
import { captureServerException, normalizeClientErrorPayload } from "@/lib/monitoring";

export async function POST(request: Request) {
  try {
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
