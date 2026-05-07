export function getSafeRedirect(target: string | null | undefined, fallback = "/mi-cuenta") {
  if (!target) {
    return fallback;
  }

  if (!target.startsWith("/") || target.startsWith("//")) {
    return fallback;
  }

  return target;
}
