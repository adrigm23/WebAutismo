import type { UserGlobalRole } from "@prisma/client";

export function getDefaultPrivateRedirect(globalRole: UserGlobalRole) {
  if (globalRole === "ADMIN") return "/admin";
  if (globalRole === "TEACHER") return "/docente";
  return "/mis-cursos";
}

export function getSafeRedirect(target: string | null | undefined, fallback = "/mis-cursos") {
  if (!target) {
    return fallback;
  }

  if (!target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }

  return target;
}

export function getPostLoginRedirect(
  target: string | null | undefined,
  globalRole: UserGlobalRole,
) {
  const fallback = getDefaultPrivateRedirect(globalRole);
  const safeTarget = getSafeRedirect(target, fallback);

  if (globalRole === "ADMIN" && /^\/mi-cuenta(?:$|[?#])/.test(safeTarget)) {
    return "/admin";
  }

  if (globalRole === "TEACHER" && /^\/mi-cuenta(?:$|[?#])/.test(safeTarget)) {
    return "/docente";
  }

  return safeTarget;
}
