import {
  buildCourseResourcesHref,
  COURSE_RESOURCE_MANAGER_TARGET_ID,
  getCourseResourceIdFromTargetId,
  normalizeCourseResourceQueryValue
} from "@/lib/course-navigation";

describe("course resource navigation", () => {
  test("keeps the manager anchor out of the resource query parameter", () => {
    expect(buildCourseResourcesHref("curso-demo", COURSE_RESOURCE_MANAGER_TARGET_ID)).toBe(
      "/mis-cursos/curso-demo?tab=resources#resource-manager-top"
    );
    expect(getCourseResourceIdFromTargetId(COURSE_RESOURCE_MANAGER_TARGET_ID)).toBeNull();
  });

  test("keeps resource cards addressable with resource query and hash", () => {
    expect(buildCourseResourcesHref("curso-demo", "resource-res-1")).toBe(
      "/mis-cursos/curso-demo?tab=resources&resource=res-1#resource-res-1"
    );
    expect(getCourseResourceIdFromTargetId("resource-res-1")).toBe("res-1");
  });

  test("drops the legacy manager-top resource query value", () => {
    expect(normalizeCourseResourceQueryValue("manager-top")).toBeNull();
    expect(normalizeCourseResourceQueryValue("res-1")).toBe("res-1");
  });
});
