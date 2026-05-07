export function buildProtectedForumAttachmentUrl(id: string) {
  return `/api/forum/attachments/${id}`;
}

export function legacyForumAttachmentUrlToStorageKey(url: string) {
  if (!url.startsWith("/uploads/forum/")) {
    return null;
  }

  return url.replace(/^\/uploads\//, "");
}
