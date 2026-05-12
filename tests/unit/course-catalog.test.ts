const getDbMock = vi.fn();
const isLegacyCatalogFallbackEnabledMock = vi.fn(() => false);

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

vi.mock("@/lib/env", () => ({
  isLegacyCatalogFallbackEnabled: isLegacyCatalogFallbackEnabledMock
}));

describe("course catalog fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isLegacyCatalogFallbackEnabledMock.mockReturnValue(false);
  });

  test("falls back to legacy catalog when the database connection is unavailable", async () => {
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
});
