"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";

const reservedSections = new Set(["nuevo", "moderacion", "historico"]);

function getForumNextPath(pathname: string, search: string) {
  return `${pathname}${search ? `?${search}` : ""}`;
}

function getCurrentCategorySlug(pathname: string, forumRootPath: string) {
  const relativePath = pathname.startsWith(forumRootPath)
    ? pathname.slice(forumRootPath.length)
    : "";
  const [segment] = relativePath.split("/").filter(Boolean);

  if (!segment || reservedSections.has(segment)) {
    return null;
  }

  return segment;
}

export function ForumShellSearchInput() {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get("q") ?? "";

  return (
    <input
      className="w-full min-w-0 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
      defaultValue={currentQuery}
      name="q"
      placeholder="Buscar en la comunidad..."
      type="search"
    />
  );
}

type ForumShellNewThreadButtonProps = {
  courseSlug: string;
};

export function ForumShellNewThreadButton({
  courseSlug
}: ForumShellNewThreadButtonProps) {
  const pathname = usePathname();
  const forumRootPath = `/mis-cursos/${courseSlug}/foro`;
  const currentCategorySlug = getCurrentCategorySlug(pathname, forumRootPath);
  const href = currentCategorySlug
    ? `${forumRootPath}/${currentCategorySlug}/nuevo`
    : `${forumRootPath}/nuevo`;

  return <ButtonLink href={href}>Nuevo hilo</ButtonLink>;
}

export function ForumShellNextPathInput() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextPath = getForumNextPath(pathname, searchParams.toString());

  return <input name="nextPath" type="hidden" value={nextPath} />;
}
