const redirectMock = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});

const createSessionMock = vi.fn();
const ensureBootstrapAdminMock = vi.fn();
const hashPasswordMock = vi.fn(async () => "hashed-password");
const verifyPasswordMock = vi.fn(async () => true);
const writeAuditLogMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("@/lib/auth", () => ({
  createSession: createSessionMock,
  ensureBootstrapAdmin: ensureBootstrapAdminMock,
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock
}));

vi.mock("@/lib/audit", () => ({
  writeAuditLog: writeAuditLogMock
}));

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

describe("auth server actions", () => {
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

  test("does not allow demo login when demo auth is disabled", async () => {
    const db = {
      user: {
        findUnique: vi.fn(async () => null)
      }
    };

    getDbMock.mockReturnValue(db);

    const { loginAction } = await import("@/actions/auth");
    const formData = new FormData();
    formData.set("email", "admin.demo@autismo.local");
    formData.set("password", "whatever123");

    const result = await loginAction({}, formData);

    expect(result).toEqual({
      error: "No existe una cuenta con ese correo."
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  test("registers a user and redirects to the account page", async () => {
    const db = {
      user: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async () => ({
          id: "user-1",
          email: "ana@example.com",
          globalRole: "STUDENT"
        }))
      }
    };

    getDbMock.mockReturnValue(db);
    ensureBootstrapAdminMock.mockResolvedValue(null);

    const { registerAction } = await import("@/actions/auth");
    const formData = new FormData();
    formData.set("name", "Ana Lopez");
    formData.set("email", "ana@example.com");
    formData.set("password", "supersegura123");
    formData.set("confirmPassword", "supersegura123");

    await expect(registerAction({}, formData)).rejects.toThrow("REDIRECT:/mi-cuenta");

    expect(db.user.create).toHaveBeenCalled();
    expect(hashPasswordMock).toHaveBeenCalledWith("supersegura123");
    expect(createSessionMock).toHaveBeenCalledWith("user-1");
    expect(writeAuditLogMock).toHaveBeenCalled();
  });
});
