const redirectMock = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});

const createSessionMock = vi.fn();
const ensureBootstrapAdminMock = vi.fn();
const hashPasswordMock = vi.fn(async () => "hashed-password");
const verifyPasswordMock = vi.fn(async () => true);
const writeAuditLogMock = vi.fn();
const getDbMock = vi.fn();
const headersMock = vi.fn(async () => new Headers());

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/headers", () => ({
  headers: headersMock
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

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      SESSION_SECRET: "test-session-secret",
      RATE_LIMIT_BACKEND: "memory"
    };

    const { resetRateLimitStore } = await import("@/lib/rate-limit");
    resetRateLimitStore();
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

    expect(result.error).toMatch(/Credenciales no/i);
    expect(result.fields).toEqual({
      email: "admin.demo@autismo.local"
    });
    expect(createSessionMock).not.toHaveBeenCalled();
  });

  test("preserves name and email on register validation errors", async () => {
    const { registerAction } = await import("@/actions/auth");
    const formData = new FormData();
    formData.set("name", "Ana Lopez");
    formData.set("email", "ana@example.com");
    formData.set("password", "supersegura123");
    formData.set("confirmPassword", "distinta123");

    const result = await registerAction({}, formData);

    expect(result).toEqual({
      error: "Las contrasenas no coinciden.",
      fields: {
        name: "Ana Lopez",
        email: "ana@example.com"
      }
    });
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

  test("redirects admins directly to the admin panel on login", async () => {
    const db = {
      user: {
        findUnique: vi.fn(async () => ({
          id: "admin-1",
          email: "admin@example.com",
          passwordHash: "hashed-password",
          globalRole: "ADMIN",
          isActive: true
        }))
      }
    };

    getDbMock.mockReturnValue(db);
    ensureBootstrapAdminMock.mockResolvedValue("ADMIN");

    const { loginAction } = await import("@/actions/auth");
    const formData = new FormData();
    formData.set("email", "admin@example.com");
    formData.set("password", "supersegura123");

    await expect(loginAction({}, formData)).rejects.toThrow("REDIRECT:/admin");

    expect(createSessionMock).toHaveBeenCalledWith("admin-1");
    expect(verifyPasswordMock).toHaveBeenCalledWith("supersegura123", "hashed-password");
  });

  test("redirects bootstrap admins directly to the admin panel on register", async () => {
    const db = {
      user: {
        findUnique: vi.fn(async () => null),
        create: vi.fn(async () => ({
          id: "user-bootstrap",
          email: "bootstrap@example.com",
          globalRole: "STUDENT"
        }))
      }
    };

    getDbMock.mockReturnValue(db);
    ensureBootstrapAdminMock.mockResolvedValue("ADMIN");

    const { registerAction } = await import("@/actions/auth");
    const formData = new FormData();
    formData.set("name", "Bootstrap Admin");
    formData.set("email", "bootstrap@example.com");
    formData.set("password", "supersegura123");
    formData.set("confirmPassword", "supersegura123");

    await expect(registerAction({}, formData)).rejects.toThrow("REDIRECT:/admin");

    expect(createSessionMock).toHaveBeenCalledWith("user-bootstrap");
    expect(writeAuditLogMock).toHaveBeenCalled();
  });
});
