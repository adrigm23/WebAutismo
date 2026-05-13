import type { UserGlobalRole } from "@prisma/client";

export type TeacherSummary = {
  id: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  createdAt: Date;
  updatedAt: Date;
  editionAssignments: Array<{
    courseEditionId: string;
    courseEdition: {
      id: string;
      label: string;
      courseId: string;
      course: {
        title: string;
        slug: string;
      };
    };
  }>;
  courseAssignments: Array<{
    courseId: string;
    course: {
      id: string;
      title: string;
      slug: string;
      editions: Array<{
        id: string;
        label: string;
      }>;
    };
  }>;
  activeStudents: number;
  activeEditions: number;
};

export type TeacherCourseOption = {
  id: string;
  title: string;
  slug: string;
  editions: Array<{
    id: string;
    label: string;
    status: "ACTIVE" | "SCHEDULED" | "CLOSED" | "CANCELLED";
  }>;
};
