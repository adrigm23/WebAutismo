import { PrismaClient } from "@prisma/client";
import { isDevelopmentRuntime } from "@/lib/env";

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
      log: isDevelopmentRuntime() ? ["warn", "error"] : ["error"]
    });

  if (isDevelopmentRuntime()) {
    globalThis.prisma = prismaClient;
  }

  return prismaClient;
}
