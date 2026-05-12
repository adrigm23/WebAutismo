export type SupervisionAccessState = "active" | "scheduled" | "expired" | "inactive";

export type ProgressSummary = {
  completedModules: number;
  totalModules: number;
  completionRate: number;
  lastCompletedAt: Date | null;
};

export type SupervisionTableRow = {
  id: string;
  href: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  editionLabel: string;
  completionRate: number;
  completedModules: number;
  totalModules: number;
  lastCompletedAt: Date | null;
  accessState: SupervisionAccessState;
};

export type SupervisionDetailData = {
  enrollmentId: string;
  studentName: string;
  studentInitials: string;
  courseTitle: string;
  enrollmentStatusLabel: string;
  accessUntilLabel: string;
  lastCompletedLabel: string;
  teachersLabel: string;
  formStatusValue?: string;
  formAccessUntilValue?: string;
  formNotesValue?: string;
};

export type SupervisionCourseOption = {
  id: string;
  title: string;
};

export type SupervisionTeacherOption = {
  id: string;
  name: string;
};
