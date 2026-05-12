import { isStaffCourseRole, type CourseRole } from "@/lib/course-roles";

const FORUM_SELF_EDIT_WINDOW_MS = 15 * 60 * 1000;

export function canEditForumContent(input: {
  currentUserId: string;
  authorId: string;
  role: CourseRole;
  createdAt: Date;
}) {
  if (isStaffCourseRole(input.role)) {
    return true;
  }

  return (
    input.currentUserId === input.authorId &&
    Date.now() - input.createdAt.getTime() <= FORUM_SELF_EDIT_WINDOW_MS
  );
}
