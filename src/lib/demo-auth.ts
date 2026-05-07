import type { UserGlobalRole } from "@prisma/client";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  globalRole: UserGlobalRole;
  isActive: true;
  createdAt: Date;
};

const DEMO_CREATED_AT = new Date("2026-05-07T09:00:00.000Z");
const DEFAULT_DEMO_PASSWORD = "demo12345";

const demoUsers: DemoUser[] = [
  {
    id: "demo-admin",
    name: "Admin Demo",
    email: "admin.demo@autismo.local",
    globalRole: "ADMIN",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  },
  {
    id: "demo-teacher",
    name: "Docente Demo",
    email: "docente.demo@autismo.local",
    globalRole: "TEACHER",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  },
  {
    id: "demo-student",
    name: "Alumno Demo",
    email: "alumno.demo@autismo.local",
    globalRole: "STUDENT",
    isActive: true,
    createdAt: DEMO_CREATED_AT
  }
];

export function getDemoPassword() {
  return process.env.DEMO_AUTH_PASSWORD || DEFAULT_DEMO_PASSWORD;
}

export function getDemoUsers() {
  return demoUsers;
}

export function isDemoUserId(userId: string) {
  return userId.startsWith("demo-");
}

export function getDemoUserById(userId: string) {
  return demoUsers.find((user) => user.id === userId) ?? null;
}

export function getDemoUserByEmail(email: string) {
  return demoUsers.find((user) => user.email === email.trim().toLowerCase()) ?? null;
}

export function isValidDemoPassword(password: string) {
  return password === getDemoPassword();
}
