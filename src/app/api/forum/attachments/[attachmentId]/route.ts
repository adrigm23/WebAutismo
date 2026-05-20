import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { buildPrivateFileHeaders } from "@/lib/download-response";
import { readStoredForumAttachmentContent } from "@/lib/forum-attachment-storage";
import { createRequestLogger, getRequestIdFromHeaders } from "@/lib/logger";
import { getDb } from "@/lib/prisma";
import { buildRequestFingerprint } from "@/lib/request-client";
import { consumeRateLimit } from "@/lib/rate-limit";

type AttachmentContext = {
  id: string;
  kind: "FILE" | "IMAGE" | "LINK" | "VIDEO";
  mimeType: string | null;
  label: string;
  storageKey: string | null;
  thread:
    | {
        category: {
          courseSlug: string;
        };
      }
    | null;
  post:
    | {
        thread: {
          category: {
            courseSlug: string;
          };
        };
      }
    | null;
};

function getAttachmentCourseSlug(attachment: AttachmentContext) {
  return attachment.thread?.category.courseSlug ?? attachment.post?.thread.category.courseSlug ?? null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;
  const downloadLogger = createRequestLogger({
    requestId: getRequestIdFromHeaders(request.headers),
    route: "/api/forum/attachments/[attachmentId]",
    action: "downloadForumAttachment"
  });
  const startedAt = Date.now();
  const user = await getCurrentUser();

  if (!user) {
    downloadLogger.warn("Forum attachment download rejected because user is not authenticated.", {
      attachmentId,
      result: "unauthenticated",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const attachment = (await getDb().forumAttachment.findUnique({
    where: {
      id: attachmentId
    },
    include: {
      thread: {
        select: {
          category: {
            select: {
              courseSlug: true
            }
          }
        }
      },
      post: {
        select: {
          thread: {
            select: {
              category: {
                select: {
                  courseSlug: true
                }
              }
            }
          }
        }
      }
    }
  })) as AttachmentContext | null;

  if (!attachment || !attachment.storageKey) {
    downloadLogger.warn("Forum attachment download failed because the attachment was not found.", {
      userId: user.id,
      attachmentId,
      result: "missing-attachment",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const courseSlug = getAttachmentCourseSlug(attachment);

  if (!courseSlug) {
    downloadLogger.warn("Forum attachment download failed because the attachment is detached from a course.", {
      userId: user.id,
      attachmentId,
      result: "missing-course",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Attachment is not linked to a course." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug
  });

  if (!accessResult.allowed) {
    downloadLogger.warn("Forum attachment download denied by course access policy.", {
      userId: user.id,
      attachmentId,
      courseSlug,
      result: "forbidden",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json({ error: "Attachment access denied." }, { status: 403 });
  }

  const downloadRateLimit = await consumeRateLimit({
    bucket: "forum-attachment-download",
    key: buildRequestFingerprint(request.headers, [user.id, attachmentId]),
    limit: 30,
    windowMs: 5 * 60 * 1_000
  });

  if (!downloadRateLimit.allowed) {
    downloadLogger.warn("Forum attachment download rate limited.", {
      userId: user.id,
      attachmentId,
      courseSlug,
      result: "rate-limited",
      durationMs: Date.now() - startedAt
    });
    return NextResponse.json(
      { error: "Too many download requests." },
      {
        status: 429,
        headers: {
          "Retry-After": `${downloadRateLimit.retryAfterSeconds}`
        }
      }
    );
  }

  try {
    const fileBuffer = await readStoredForumAttachmentContent(attachment.storageKey);
    const isInlineImage = attachment.kind === "IMAGE";
    const headers = buildPrivateFileHeaders({
      fileName: attachment.label,
      inline: isInlineImage,
      mimeType: attachment.mimeType
    });

    downloadLogger.info("Forum attachment downloaded.", {
      userId: user.id,
      attachmentId,
      courseSlug,
      result: "downloaded",
      durationMs: Date.now() - startedAt
    });

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    downloadLogger.error("Forum attachment download failed while reading storage.", {
      userId: user.id,
      attachmentId,
      courseSlug,
      result: "storage-miss",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Stored attachment file not found."
      },
      { status: 404 }
    );
  }
}
