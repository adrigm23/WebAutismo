import type { UserGlobalRole } from "@prisma/client";

export type UserRoleFilter = "ALL" | UserGlobalRole;
export type UserStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export type DemoUserDirectoryItem = {
  id: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  createdAt: Date;
};

export type UserDirectoryItem = {
  id: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  notificationPreference: {
    emailEnabled: boolean;
    webEnabled: boolean;
  } | null;
  _count: {
    enrollments: number;
    purchases: number;
    courseAssignments: number;
  };
};
