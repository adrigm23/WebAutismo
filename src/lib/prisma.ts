import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient | null = null;

export function getDb() {
  if (prismaClient) {
    return prismaClient;
  }

  prismaClient =
    globalThis.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prismaClient;
  }

  return prismaClient;
}
