import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { canAccessCourseCommunity } from "@/lib/course-community";
import { resolveForumAttachmentFilePath } from "@/lib/forum-attachment-storage";
import { getDb } from "@/lib/prisma";

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
  _: Request,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const { attachmentId } = await params;
  const user = await getCurrentUser();

  if (!user) {
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
    return NextResponse.json({ error: "Attachment not found." }, { status: 404 });
  }

  const courseSlug = getAttachmentCourseSlug(attachment);

  if (!courseSlug) {
    return NextResponse.json({ error: "Attachment is not linked to a course." }, { status: 404 });
  }

  const accessResult = await canAccessCourseCommunity({
    userId: user.id,
    email: user.email,
    courseSlug
  });

  if (!accessResult.allowed) {
    return NextResponse.json({ error: "Attachment access denied." }, { status: 403 });
  }

  try {
    const filePath = await resolveForumAttachmentFilePath(attachment.storageKey);
    const fileBuffer = await readFile(filePath);
    const isInlineImage = attachment.kind === "IMAGE";
    const headers = new Headers();

    headers.set("Content-Type", attachment.mimeType || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `${isInlineImage ? "inline" : "attachment"}; filename="${attachment.label}"`
    );
    headers.set("Cache-Control", "private, no-store");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });
  } catch {
    return NextResponse.json({ error: "Stored attachment file not found." }, { status: 404 });
  }
}
