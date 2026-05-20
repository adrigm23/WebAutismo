const getDbMock = vi.fn();
const isLegacyCatalogFallbackEnabledMock = vi.fn(() => false);
const isDevelopmentRuntimeMock = vi.fn(() => true);

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

vi.mock("@/lib/env", () => ({
  isLegacyCatalogFallbackEnabled: isLegacyCatalogFallbackEnabledMock,
  isDevelopmentRuntime: isDevelopmentRuntimeMock
}));

describe("course catalog fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isLegacyCatalogFallbackEnabledMock.mockReturnValue(false);
    isDevelopmentRuntimeMock.mockReturnValue(true);
  });

  test("falls back to legacy catalog only when the explicit fallback flag is enabled", async () => {
    const connectionError = Object.assign(new Error("Can't reach database server at `db:3306`"), {
      name: "PrismaClientInitializationError"
    });

    getDbMock.mockReturnValue({
      course: {
        findMany: vi.fn(async () => {
          throw connectionError;
        })
      }
    });

    isLegacyCatalogFallbackEnabledMock.mockReturnValue(true);

    const { getCatalogCourses } = await import("@/lib/course-catalog");
    const courses = await getCatalogCourses();

    expect(courses.length).toBeGreaterThan(0);
    expect(courses.every((course) => course.source === "legacy")).toBe(true);
  });

  test("rethrows non-connectivity errors when legacy fallback is disabled", async () => {
    const unexpectedError = new Error("Unexpected query failure");

    getDbMock.mockReturnValue({
      course: {
        findMany: vi.fn(async () => {
          throw unexpectedError;
        })
      }
    });

    const { getCatalogCourses } = await import("@/lib/course-catalog");

    await expect(getCatalogCourses()).rejects.toThrow("Unexpected query failure");
  });

  test("keeps database module ids while preserving legacy module keys", async () => {
    getDbMock.mockReturnValue({
      course: {
        findUnique: vi.fn(async () => ({
          id: "course-db-1",
          slug: "curso-db",
          title: "Curso real",
          shortDescription: "Resumen",
          description: "Descripcion",
          priceInCents: 1000,
          duration: "4 horas",
          format: "Online",
          level: "Iniciacion",
          accentFrom: "#0C71C3",
          accentTo: "#F7F3EB",
          category: "general",
          audienceJson: [],
          outcomesJson: [],
          methodologyJson: [],
          faqJson: [],
          seoTitle: "SEO",
          seoDescription: "SEO desc",
          modules: [
            {
              id: "module-db-1",
              moduleKey: "modulo-legado-1",
              title: "Modulo 1",
              description: "Contenido",
              estimatedTime: "30 min",
              resourcesSummary: "Resumen",
              position: 0
            }
          ],
          editions: [],
          teacherAssignments: []
        }))
      }
    });

    const { getCatalogCourseBySlug } = await import("@/lib/course-catalog");
    const course = await getCatalogCourseBySlug("curso-db");

    expect(course?.modules[0]?.id).toBe("module-db-1");
    expect(course?.modules[0]?.moduleKey).toBe("modulo-legado-1");
  });
});
