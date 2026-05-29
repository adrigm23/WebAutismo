import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogCourseBySlug } from "@/lib/course-catalog";
import { canAccessCourseCommunityForCourse, canModerateCourse } from "@/lib/course-community";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 1. Authenticate user
        const user = await getCurrentUser();
        if (!user) {
          throw new Error("Debes iniciar sesion para gestionar recursos.");
        }

        // 2. Parse client payload to check course slug
        if (!clientPayload) {
          throw new Error("Faltan datos del curso.");
        }

        let parsedPayload;
        try {
          parsedPayload = JSON.parse(clientPayload);
        } catch {
          throw new Error("Payload de cliente invalido.");
        }

        const { courseSlug } = parsedPayload;
        if (!courseSlug) {
          throw new Error("Falta el identificador del curso.");
        }

        // 3. Retrieve catalog course details
        const course = await getCatalogCourseBySlug(courseSlug);
        if (!course) {
          throw new Error("El curso indicado no existe.");
        }

        // 4. Validate user course moderation permission
        const access = await canAccessCourseCommunityForCourse({
          userId: user.id,
          email: user.email,
          course,
          userGlobalRole: user.globalRole,
          userIsActive: user.isActive
        });

        if (!access.allowed || !canModerateCourse(access.role)) {
          throw new Error("No tienes permisos para gestionar recursos de este curso.");
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
        // We will persist the metadata + key in Prisma within the lightweight Server Action,
        // so no database logic is needed in this callback. We just log the completion.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fallo al generar el token de subida." },
      { status: 400 }
    );
  }
}
