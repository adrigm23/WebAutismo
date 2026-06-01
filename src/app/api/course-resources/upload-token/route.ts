import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { getCourseIdentityBySlug } from "@/lib/course-identity";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";

/**
 * Generates a short-lived Vercel Blob client upload token after verifying
 * that the requesting user has moderation access to the given course.
 *
 * Performance notes:
 * - Uses getCourseIdentityBySlug (id + slug only) instead of getCatalogCourseBySlug
 *   to avoid loading modules, editions, and teacher assignments unnecessarily.
 * - touchUserSession runs fire-and-forget (see user-sessions.ts) so it does not
 *   add a sequential DB write to the critical path.
 * - Set DEBUG_UPLOAD_TOKEN_TIMING=true to log per-step timings without noise in prod.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const debugTiming = process.env.DEBUG_UPLOAD_TOKEN_TIMING === "true";
  const t0 = debugTiming ? performance.now() : 0;

  // Mutable timing markers written from inside onBeforeGenerateToken.
  let tAuth = 0;
  let tCourse = 0;
  let tAccess = 0;

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // ── 1. Authenticate ──────────────────────────────────────────────────
        const user = await getCurrentUser();
        if (debugTiming) tAuth = performance.now();

        if (!user) {
          throw new Error("Debes iniciar sesion para gestionar recursos.");
        }

        // ── 2. Parse client payload ───────────────────────────────────────────
        if (!clientPayload) {
          throw new Error("Faltan datos del curso.");
        }

        let parsedPayload: { courseSlug?: string };
        try {
          parsedPayload = JSON.parse(clientPayload) as { courseSlug?: string };
        } catch {
          throw new Error("Payload de cliente invalido.");
        }

        const { courseSlug } = parsedPayload;
        if (!courseSlug) {
          throw new Error("Falta el identificador del curso.");
        }

        // ── 3. Lightweight course identity (id + slug only) ──────────────────
        // Replaces getCatalogCourseBySlug which unnecessarily loaded modules,
        // editions, and teacher assignments — none of which are needed here.
        const course = await getCourseIdentityBySlug(courseSlug);
        if (debugTiming) tCourse = performance.now();

        if (!course) {
          throw new Error("El curso indicado no existe.");
        }

        // ── 4. Validate moderation permission ────────────────────────────────
        const access = await canAccessCourseCommunityForCourse({
          userId: user.id,
          email: user.email,
          course,
          userGlobalRole: user.globalRole,
          userIsActive: user.isActive,
        });
        if (debugTiming) tAccess = performance.now();

        if (!access.allowed || !canModerateCourse(access.role)) {
          throw new Error(
            "No tienes permisos para gestionar recursos de este curso.",
          );
        }

        return {
          allowedContentTypes: [
            "application/msword",
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png",
            "image/webp",
            "text/csv",
            "text/plain",
          ],
          tokenPayload: JSON.stringify({
            userId: user.id,
            courseId: course.id,
          }),
        };
      },
      onUploadCompleted: async () => {
        // Metadata is persisted via a lightweight Server Action after the upload
        // completes — no DB logic needed in this callback.
      },
    });

    if (debugTiming) {
      const tEnd = performance.now();
      // tAccess marks the end of the last DB step inside onBeforeGenerateToken.
      // Everything between tAccess and tEnd is HMAC signing + SDK overhead.
      console.log(
        `[upload-token timing] auth=${(tAuth - t0).toFixed(0)}ms` +
          ` course=${(tCourse - tAuth).toFixed(0)}ms` +
          ` access=${(tAccess - tCourse).toFixed(0)}ms` +
          ` token=${(tEnd - tAccess).toFixed(0)}ms` +
          ` total=${(tEnd - t0).toFixed(0)}ms`,
      );
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Fallo al generar el token de subida.",
      },
      { status: 400 },
    );
  }
}
