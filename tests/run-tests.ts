import { runCourseCloningTests } from "./course-cloning.test.ts";
import { runCourseEditionTests } from "./course-editions.test.ts";
import { runCourseProgressTests } from "./course-progress.test.ts";
import { runForumAttachmentStorageTests } from "./forum-attachment-storage.test.ts";
import { runPermissionTests } from "./permissions.test.ts";
import { runPromotionTests } from "./promotions.test.ts";

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

runTest("course-progress", runCourseProgressTests);
runTest("promotions", runPromotionTests);
runTest("permissions", runPermissionTests);
runTest("course-editions", runCourseEditionTests);
runTest("course-cloning", runCourseCloningTests);
runTest("forum-attachment-storage", runForumAttachmentStorageTests);

console.log("All unit tests passed.");
