const getCurrentSessionUserIdMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("@/lib/user-sessions", () => ({
  clearCurrentUserSession: vi.fn(),
  createUserSession: vi.fn(),
  getCurrentSessionUserId: getCurrentSessionUserIdMock
}));

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

describe("getCurrentUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      SESSION_SECRET: "test-session-secret"
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("resolves the current session user for each call without leaking prior sessions", async () => {
    const usersById = new Map([
      [
        "student-1",
        {
          id: "student-1",
          name: "Student One",
          email: "student@example.com",
          globalRole: "STUDENT",
          isActive: true,
          createdAt: new Date("2026-05-25T10:00:00.000Z")
        }
      ],
      [
        "admin-1",
        {
          id: "admin-1",
          name: "Admin One",
          email: "admin@example.com",
          globalRole: "ADMIN",
          isActive: true,
          createdAt: new Date("2026-05-25T10:05:00.000Z")
        }
      ]
    ]);

    getCurrentSessionUserIdMock
      .mockResolvedValueOnce("student-1")
      .mockResolvedValueOnce("admin-1");

    getDbMock.mockReturnValue({
      user: {
        findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
          return usersById.get(where.id) ?? null;
        })
      }
    });

    const { getCurrentUser } = await import("@/lib/auth");

    const firstUser = await getCurrentUser();
    const secondUser = await getCurrentUser();

    expect(firstUser).toMatchObject({
      id: "student-1",
      globalRole: "STUDENT"
    });
    expect(secondUser).toMatchObject({
      id: "admin-1",
      globalRole: "ADMIN"
    });
  });
});
