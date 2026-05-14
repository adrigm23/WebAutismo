import type { ForumAuditAction, ForumNotificationType } from "@prisma/client";
import type { CourseRole } from "@/lib/course-roles";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isProductionEnv } from "@/lib/env";
import { isSafeHttpUrl } from "@/lib/file-security";
import { captureOperationalWarning } from "@/lib/monitoring";

const MAX_FORUM_THREADS_PER_PAGE = 50;
const MAX_FORUM_POSTS_PER_THREAD = 100;
const DEFAULT_FORUM_THREADS_PAGE_SIZE = 12;
const DEFAULT_FORUM_POSTS_PAGE_SIZE = 20;

export type ForumViewerRole = CourseRole | null | undefined;

export type ForumCategorySummary = {
  id: string;
  forumSpaceId: string | null;
  slug: string;
  title: string;
  description: string;
  _count: {
    threads: number;
  };
};

export type ForumThreadListItem = {
  id: string;
  title: string;
  body: string;
  type: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned: boolean;
  isClosed: boolean;
  isResolved: boolean;
  isReadOnly: boolean;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  lastActivityAt: Date;
  createdAt: Date;
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
  _count: {
    posts: number;
  };
};

export type ForumAttachmentItem = {
  id: string;
  kind: "FILE" | "IMAGE" | "LINK" | "VIDEO";
  label: string;
  url: string;
  mimeType: string | null;
  sizeInBytes: number | null;
};

export type ForumThreadPostItem = {
  id: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  attachments: ForumAttachmentItem[];
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
};

export type ForumThreadDetail = {
  id: string;
  title: string;
  body: string;
  type: "DISCUSSION" | "ANNOUNCEMENT";
  isPinned: boolean;
  isClosed: boolean;
  isResolved: boolean;
  isReadOnly: boolean;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  editedAt: Date | null;
  resolvedPostId: string | null;
  createdAt: Date;
  attachments: ForumAttachmentItem[];
  authorRole: CourseRole;
  author: {
    id: string;
    name: string;
  };
  posts: ForumThreadPostItem[];
};

export type ForumPagination = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ForumThreadQuery = {
  q?: string;
  sort?: "recent" | "created" | "activity";
  status?: "open" | "closed" | "resolved";
  type?: "announcement" | "discussion";
  filter?: "unanswered";
  page?: number;
  pageSize?: number;
};

export type ForumModerationReportItem = {
  id: string;
  reason: string;
  createdAt: Date;
  reportedById?: string;
  thread: {
    id: string;
    title: string;
    categorySlug: string;
  } | null;
  post: {
    id: string;
    threadId: string;
    threadTitle: string;
    categorySlug: string;
  } | null;
};

export type ForumScheduledAnnouncementItem = {
  id: string;
  title: string;
  categorySlug: string;
  scheduledFor: Date;
};

export type ForumDeletedThreadItem = {
  id: string;
  title: string;
  categorySlug: string;
  deletedAt: Date;
};

export type ForumDeletedPostItem = {
  id: string;
  threadId: string;
  threadTitle: string;
  categorySlug: string;
  deletedAt: Date;
};

export type ForumAuditActivityItem = {
  id: string;
  action: ForumAuditAction;
  actorRole: CourseRole;
  createdAt: Date;
  summary: string;
  linkPath: string | null;
};

export type ForumNotificationListItem = {
  id: string;
  courseSlug: string;
  type: ForumNotificationType;
  title: string;
  body: string;
  linkPath: string;
  readAt: Date | null;
  createdAt: Date;
};

export function canUseForumFallback(error: unknown) {
  return !isProductionEnv() && isDatabaseConnectionError(error);
}

export function logForumFallback(operation: string, courseSlug: string, error: unknown) {
  captureOperationalWarning("Forum fallback activated.", {
    operation,
    courseSlug,
    error: error instanceof Error ? error : new Error(String(error))
  });
}

export function sanitizeForumAttachment(attachment: ForumAttachmentItem) {
  if (
    (attachment.kind === "LINK" || attachment.kind === "VIDEO") &&
    !isSafeHttpUrl(attachment.url)
  ) {
    return null;
  }

  return attachment;
}

function normalizePage(value: number | undefined) {
  return Number.isFinite(value) && value && value > 0 ? Math.floor(value) : 1;
}

function normalizePageSize(value: number | undefined, maxPageSize: number, fallback: number) {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(value), maxPageSize);
}

export function buildPagination(input: {
  page?: number;
  pageSize?: number;
  totalItems: number;
  maxPageSize?: number;
  fallbackPageSize?: number;
  mode?: "threads" | "posts";
}) {
  const maxPageSize =
    input.maxPageSize ??
    (input.mode === "posts" ? MAX_FORUM_POSTS_PER_THREAD : MAX_FORUM_THREADS_PER_PAGE);
  const fallbackPageSize =
    input.fallbackPageSize ??
    (input.mode === "posts" ? DEFAULT_FORUM_POSTS_PAGE_SIZE : DEFAULT_FORUM_THREADS_PAGE_SIZE);
  const pageSize = normalizePageSize(input.pageSize, maxPageSize, fallbackPageSize);
  const totalPages = Math.max(Math.ceil(input.totalItems / pageSize), 1);
  const page = Math.min(normalizePage(input.page), totalPages);

  return {
    page,
    pageSize,
    totalItems: input.totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  } satisfies ForumPagination;
}
