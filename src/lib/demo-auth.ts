import type { UserGlobalRole } from "@prisma/client";
import { getRequiredEnv, isDemoAuthEnabled } from "@/lib/env";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date;
  globalRole: UserGlobalRole;
  isActive: true;
  createdAt: Date;
};

const DEMO_CREATED_AT = new Date("2026-05-07T09:00:00.000Z");

const demoUsers: DemoUser[] = [
  {
    id: "demo-admin",
    name: "Admin Demo",
    email: "admin.demo@autismo.local",
    emailVerifiedAt: DEMO_CREATED_AT,
    globalRole: "ADMIN",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  },
  {
    id: "demo-teacher",
    name: "Docente Demo",
    email: "docente.demo@autismo.local",
    emailVerifiedAt: DEMO_CREATED_AT,
    globalRole: "TEACHER",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  },
  {
    id: "demo-student",
    name: "Alumno Demo",
    email: "alumno.demo@autismo.local",
    emailVerifiedAt: DEMO_CREATED_AT,
    globalRole: "STUDENT",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  }
];

export function getDemoPassword() {
  return getRequiredEnv("DEMO_AUTH_PASSWORD");
}

export function getDemoUsers() {
  return isDemoAuthEnabled() ? demoUsers : [];
}

export function isDemoUserId(userId: string) {
  return userId.startsWith("demo-");
}

export function getDemoUserById(userId: string) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  return demoUsers.find((user) => user.id === userId) ?? null;
}

export function getDemoUserByEmail(email: string) {
  if (!isDemoAuthEnabled()) {
    return null;
  }

  return demoUsers.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export function isValidDemoPassword(password: string) {
  return isDemoAuthEnabled() && password === getDemoPassword();
}
