const redirectMock = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});

const revalidatePathMock = vi.fn();
const getCurrentUserMock = vi.fn();
const getCatalogCourseBySlugMock = vi.fn();
const canAccessCourseCommunityForCourseMock = vi.fn();
const canModerateCourseMock = vi.fn();
const createCourseResourceMock = vi.fn();
const writeAuditLogMock = vi.fn();
const captureOperationalWarningMock = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: writeAuditLogMock
}));

vi.mock("@/lib/course-catalog", () => ({
  getCatalogCourseBySlug: getCatalogCourseBySlugMock
}));

vi.mock("@/lib/course-community", () => ({
  canAccessCourseCommunityForCourse: canAccessCourseCommunityForCourseMock,
  canAccessCourseCommunity: vi.fn(),
  canModerateCourse: canModerateCourseMock
}));

vi.mock("@/lib/course-resources", () => ({
  createCourseResource: createCourseResourceMock,
  deleteCourseResource: vi.fn(),
  moveCourseResource: vi.fn(),
  reviewCourseResourceSubmission: vi.fn(),
  setCourseResourcePublication: vi.fn(),
  updateCourseResource: vi.fn(),
  upsertCourseResourceSubmission: vi.fn()
}));

vi.mock("@/lib/monitoring", () => ({
  captureOperationalWarning: captureOperationalWarningMock
}));

vi.mock("@/lib/notifications", () => ({
  sendPlatformNotification: vi.fn()
}));

describe("course resource actions", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "docente@example.com",
      globalRole: "USER",
      isActive: true
    });
    getCatalogCourseBySlugMock.mockResolvedValue({
      id: "course-1",
      slug: "curso-demo",
      modules: []
    });
    canAccessCourseCommunityForCourseMock.mockResolvedValue({
      allowed: true,
      role: "TEACHER"
    });
    canModerateCourseMock.mockReturnValue(true);
    writeAuditLogMock.mockResolvedValue(undefined);
  });

  test("returns a controlled error when resource storage is not ready", async () => {
    createCourseResourceMock.mockRejectedValue(
      new Error(
        "La subida de archivos no esta disponible ahora mismo porque OBJECT_STORAGE_PROVIDER no esta configurado en este entorno."
      )
    );

    const { createCourseResourceAction } = await import("@/actions/course-resources");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("type", "MATERIAL");
    formData.set("source", "FILE");
    formData.set("title", "Guia PDF");
    formData.set("storageKey", "course-resources/course-1/some-file.pdf");
    formData.set("mimeType", "application/pdf");
    formData.set("sizeInBytes", "12345");

    const result = await createCourseResourceAction({}, formData);

    expect(result).toEqual({
      error:
        "La subida de archivos no esta disponible ahora mismo porque OBJECT_STORAGE_PROVIDER no esta configurado en este entorno."
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  test("returns success and redirectUrl after a successful publish", async () => {
    createCourseResourceMock.mockResolvedValue({
      id: "res-1",
      title: "Guia PDF",
      type: "MATERIAL",
      source: "FILE",
      dueAt: null,
      passingScore: null
    });

    const { createCourseResourceAction } = await import("@/actions/course-resources");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("type", "MATERIAL");
    formData.set("source", "FILE");
    formData.set("title", "Guia PDF");
    formData.set("storageKey", "course-resources/course-1/some-file.pdf");
    formData.set("mimeType", "application/pdf");
    formData.set("sizeInBytes", "12345");

    const result = await createCourseResourceAction({}, formData);

    expect(result).toEqual({
      success: "Recurso publicado con exito.",
      redirectUrl: "/mis-cursos/curso-demo?tab=resources&resource=res-1&resourcePublished=1#resource-res-1"
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/mis-cursos/curso-demo");
  });

  test("accepts origin for external resources without requiring a file", async () => {
    createCourseResourceMock.mockResolvedValue({
      id: "res-link-1",
      title: "Bibliografia",
      type: "MATERIAL",
      source: "LINK",
      dueAt: null,
      passingScore: null
    });

    const { createCourseResourceAction } = await import("@/actions/course-resources");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("type", "MATERIAL");
    formData.set("origin", "LINK");
    formData.set("title", "Bibliografia");
    formData.set("linkUrl", "https://example.com/guia");

    const result = await createCourseResourceAction({}, formData);

    expect(result).toEqual({
      success: "Recurso publicado con exito.",
      redirectUrl: "/mis-cursos/curso-demo?tab=resources&resource=res-link-1&resourcePublished=1#resource-res-link-1"
    });
    expect(createCourseResourceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storageKey: null,
        linkUrl: "https://example.com/guia",
        source: "LINK"
      })
    );
  });

  test("returns a controlled error when the uploaded file is missing", async () => {
    const { createCourseResourceAction } = await import("@/actions/course-resources");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("type", "MATERIAL");
    formData.set("source", "FILE");
    formData.set("title", "Guia PDF");

    const result = await createCourseResourceAction({}, formData);

    expect(result).toEqual({
      error: "Sube un archivo antes de publicar el recurso."
    });
    expect(createCourseResourceMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
