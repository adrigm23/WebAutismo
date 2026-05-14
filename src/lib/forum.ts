export type {
  ForumAttachmentItem,
  ForumAuditActivityItem,
  ForumCategorySummary,
  ForumDeletedPostItem,
  ForumDeletedThreadItem,
  ForumModerationReportItem,
  ForumNotificationListItem,
  ForumPagination,
  ForumScheduledAnnouncementItem,
  ForumThreadDetail,
  ForumThreadListItem,
  ForumThreadPostItem,
  ForumThreadQuery,
  ForumViewerRole
} from "@/lib/forum-types";

export { getForumCategories, getForumThreadById, getForumThreads } from "@/lib/forum-read";
export { getForumSpaceHistory, getForumModerationDashboard } from "@/lib/forum-admin-read";
export { getForumCategory } from "@/lib/forum-categories";
export { canEditForumContent } from "@/lib/forum-permissions";

export {
  archiveCurrentForumSpace,
  restoreArchivedForumSpace,
  deleteArchivedForumSpace,
  createForumThread,
  createForumReply,
  updateForumThread,
  updateForumPost,
  deleteForumAttachment
} from "@/lib/forum-content-ops";

export {
  setThreadPinned,
  setThreadClosed,
  softDeleteThread,
  restoreThread,
  softDeletePost,
  restorePost,
  markResolvedPost,
  unmarkResolvedPost
} from "@/lib/forum-moderation-ops";

export {
  createThreadReport,
  createPostReport,
  resolveForumReport
} from "@/lib/forum-report-ops";

export {
  getUserForumNotifications,
  markForumNotificationRead,
  markAllForumNotificationsRead
} from "@/lib/forum-user-notifications";
