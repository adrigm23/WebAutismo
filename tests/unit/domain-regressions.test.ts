import { runCourseCloningTests } from "../course-cloning.test";
import { runCourseEditionTests } from "../course-editions.test";
import { runCourseProgressTests } from "../course-progress.test";
import { runForumAttachmentStorageTests } from "../forum-attachment-storage.test";
import { runPermissionTests } from "../permissions.test";
import { runPromotionTests } from "../promotions.test";

describe("domain regressions", () => {
  test("course progress", () => {
    runCourseProgressTests();
  });

  test("promotions", () => {
    runPromotionTests();
  });

  test("permissions", () => {
    runPermissionTests();
  });

  test("course editions", () => {
    runCourseEditionTests();
  });

  test("course cloning", () => {
    runCourseCloningTests();
  });

  test("forum attachment storage", () => {
    runForumAttachmentStorageTests();
  });
});
