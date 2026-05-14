import { Prisma } from "@prisma/client";

export function isDatabaseConnectionError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Can't reach database server") ||
    error.message.includes("Unknown database") ||
    error.message.includes("Access denied for user")
  );
}

export function isDatabaseSchemaDriftError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("Unknown column") ||
    error.message.includes("does not exist in the current database") ||
    error.message.includes("doesn't exist") ||
    error.message.includes("The column") ||
    error.message.includes("The table")
  );
}

export function isMissingDatabaseFieldError(error: unknown, fieldName: string) {
  if (!isDatabaseSchemaDriftError(error) || !(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes(fieldName.toLowerCase());
}
