import type { CatalogCourse } from "@/lib/course-catalog";
import type {
  CourseModuleProgressState,
  CourseProgressDetails
} from "@/lib/course-progress";
import type { CampusResourceItem } from "@/lib/course-resources";

export type LearningShellForumCategory = {
  id: string;
  slug: string;
  title: string;
  description: string;
  _count: {
    threads: number;
  };
};

export type LearningShellProps = {
  course: CatalogCourse;
  forumCategories: LearningShellForumCategory[];
  resources: CampusResourceItem[];
  progress: CourseProgressDetails;
  roleLabel: string;
  canModerate: boolean;
  editionLabel?: string | null;
  accessUntil?: Date | null;
  initialActiveTab: SidebarTab;
  initialFocusedResourceId?: string | null;
  initialModuleIndex?: number;
  showOnboarding?: boolean;
};

export type SidebarTab = "content" | "resources" | "support";

export type HeroMetric = {
  label: string;
  value: string;
  detail: string;
};

export type LearningShellModule = CourseModuleProgressState;
