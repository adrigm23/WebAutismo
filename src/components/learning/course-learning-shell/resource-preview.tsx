"use client";

import Link from "next/link";
import { ExternalLink, FileText, PlayCircle } from "lucide-react";
import type { CampusResourceItem } from "@/lib/course-resources";

function buildInlineFileHref(href: string) {
  return `${href}${href.includes("?") ? "&" : "?"}inline=1`;
}

function getYoutubeEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace(/\//g, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
}

function getVimeoEmbedUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);

    if (!url.hostname.includes("vimeo.com")) {
      return null;
    }

    const match = url.pathname.match(/\/(\d+)(?:\/([a-f0-9]+))?/);
    if (!match?.[1]) return null;

    const params = new URLSearchParams({
      color: "163c58",
      title: "0",
      byline: "0",
      portrait: "0",
      dnt: "1",
    });
    if (match[2]) params.set("h", match[2]);

    return `https://player.vimeo.com/video/${match[1]}?${params}`;
  } catch {
    return null;
  }
}

function getResourcePreview(input: { resource: CampusResourceItem }) {
  const { resource } = input;
  const fileHref = resource.href && resource.source === "FILE" ? buildInlineFileHref(resource.href) : null;

  if (resource.source === "FILE" && fileHref && resource.mimeType) {
    if (resource.mimeType === "application/pdf") {
      return {
        kind: "pdf" as const,
        src: fileHref
      };
    }

    if (resource.mimeType.startsWith("image/")) {
      return {
        kind: "image" as const,
        src: fileHref
      };
    }

    if (resource.mimeType.startsWith("video/")) {
      return {
        kind: "video" as const,
        src: fileHref
      };
    }
  }

  if (!resource.linkUrl) {
    return null;
  }

  const youtubeEmbedUrl = getYoutubeEmbedUrl(resource.linkUrl);
  if (youtubeEmbedUrl) {
    return {
      kind: "embed" as const,
      src: youtubeEmbedUrl
    };
  }

  const vimeoEmbedUrl = getVimeoEmbedUrl(resource.linkUrl);
  if (vimeoEmbedUrl) {
    return {
      kind: "embed" as const,
      src: vimeoEmbedUrl
    };
  }

  if (/\.pdf($|\?)/i.test(resource.linkUrl)) {
    return {
      kind: "pdf" as const,
      src: resource.linkUrl
    };
  }

  if (/\.(png|jpe?g|gif|webp|svg)($|\?)/i.test(resource.linkUrl)) {
    return {
      kind: "image" as const,
      src: resource.linkUrl
    };
  }

  if (/\.(mp4|webm|ogg)($|\?)/i.test(resource.linkUrl)) {
    return {
      kind: "video" as const,
      src: resource.linkUrl
    };
  }

  return null;
}

export function ModuleLessonPreview(input: {
  resource: CampusResourceItem | null;
}) {
  const preview = input.resource ? getResourcePreview({ resource: input.resource }) : null;

  if (!input.resource) {
    return (
      <div className="ui-empty-state p-6 text-sm leading-7 text-[var(--color-muted)]">
        Este módulo todavía no tiene un material principal publicado. Puedes seguir el resumen del módulo y revisar la tarea asociada cuando se publique.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
            Material principal
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--color-ink)]">{input.resource.title}</p>
        </div>
        {input.resource.href ? (
          <Link
            className="inline-flex min-h-[var(--control-height-md)] items-center rounded-[var(--radius-md)] border border-[rgba(12,113,195,0.18)] bg-white/94 px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] shadow-[var(--shadow-inset-soft)] transition hover:-translate-y-[1px] hover:border-[rgba(12,113,195,0.34)] hover:bg-[rgba(12,113,195,0.05)]"
            href={input.resource.href}
            prefetch={false}
            target={input.resource.isExternal ? "_blank" : undefined}
          >
            {input.resource.isExternal ? "Abrir material" : "Descargar material"}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <p className="text-sm leading-7 text-[var(--color-muted)]">{input.resource.description}</p>

      {preview ? (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.12)] bg-[#f7f9fb]">
          {preview.kind === "pdf" || preview.kind === "embed" ? (
            <iframe
              allow={preview.kind === "embed" ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" : undefined}
              className="aspect-video max-h-[min(70vh,32rem)] w-full bg-white"
              src={preview.src}
              title={input.resource.title}
            />
          ) : null}
          {preview.kind === "image" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={input.resource.title}
                className="max-h-[min(70vh,32rem)] w-full object-contain bg-white"
                src={preview.src}
              />
            </>
          ) : null}
          {preview.kind === "video" ? (
            <video
              className="aspect-video max-h-[min(70vh,32rem)] w-full bg-[#101722]"
              controls
              preload="metadata"
              src={preview.src}
            />
          ) : null}
        </div>
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-[rgba(12,113,195,0.12)] bg-[var(--color-surface)] p-5">
          <div className="flex items-start gap-3">
            {input.resource.resourceType === "MATERIAL" ? (
              <FileText className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
            ) : (
              <PlayCircle className="mt-1 h-5 w-5 text-[var(--color-primary)]" />
            )}
            <div>
              <p className="text-base font-semibold text-[var(--color-ink)]">Vista previa no integrada</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                Este material no se puede previsualizar dentro del campus con el formato actual, pero sigue accesible desde el botón superior.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
