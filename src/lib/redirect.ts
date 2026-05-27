import type { UserGlobalRole } from "@prisma/client";

export function getDefaultPrivateRedirect(globalRole: UserGlobalRole) {
  return globalRole === "ADMIN" ? "/admin" : "/mis-cursos";
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

  return safeTarget;
}
