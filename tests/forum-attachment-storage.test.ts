import assert from "node:assert/strict";
import {
  buildProtectedForumAttachmentUrl,
  legacyForumAttachmentUrlToStorageKey
} from "../src/lib/forum-attachment-storage.ts";

export function runForumAttachmentStorageTests() {
  assert.equal(
    legacyForumAttachmentUrlToStorageKey("/uploads/forum/curso-1/hilo-1/archivo.pdf"),
    "forum/curso-1/hilo-1/archivo.pdf"
  );

  assert.equal(legacyForumAttachmentUrlToStorageKey("https://example.com/file.pdf"), null);
  assert.equal(legacyForumAttachmentUrlToStorageKey("/api/forum/attachments/abc"), null);

  assert.equal(
    buildProtectedForumAttachmentUrl("attachment-123"),
    "/api/forum/attachments/attachment-123"
  );
}
