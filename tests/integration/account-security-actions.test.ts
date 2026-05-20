const redirectMock = vi.fn((target: string) => {
  throw new Error(`REDIRECT:${target}`);
});

const headersMock = vi.fn();
const getCurrentUserMock = vi.fn();
const clearSessionMock = vi.fn();
const canSendEmailMessageMock = vi.fn(() => true);
const sendEmailVerificationEmailMock = vi.fn();
const sendPasswordResetEmailMock = vi.fn();
const issuePasswordResetTokenMock = vi.fn();
const issueEmailVerificationTokenMock = vi.fn();
const consumePasswordResetTokenMock = vi.fn();
const revokeUserSessionsMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: redirectMock
}));

vi.mock("next/headers", () => ({
  headers: headersMock
}));

vi.mock("@/lib/auth", () => ({
  clearSession: clearSessionMock,
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/email", () => ({
  canSendEmailMessage: canSendEmailMessageMock,
  sendEmailVerificationEmail: sendEmailVerificationEmailMock,
  sendPasswordResetEmail: sendPasswordResetEmailMock
}));

vi.mock("@/lib/account-security", () => ({
  issuePasswordResetToken: issuePasswordResetTokenMock,
  issueEmailVerificationToken: issueEmailVerificationTokenMock,
  consumePasswordResetToken: consumePasswordResetTokenMock
}));

vi.mock("@/lib/user-sessions", () => ({
  revokeUserSessions: revokeUserSessionsMock
}));

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

describe("account security actions", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      RATE_LIMIT_BACKEND: "memory"
    };
    headersMock.mockResolvedValue(
      new Headers({
        "x-forwarded-for": "127.0.0.1",
        "user-agent": "Vitest"
      })
    );
    canSendEmailMessageMock.mockReturnValue(true);
    issuePasswordResetTokenMock.mockResolvedValue({
      token: "reset-token",
      expiresAt: new Date("2026-05-20T00:00:00.000Z")
    });
    issueEmailVerificationTokenMock.mockResolvedValue({
      token: "verify-token",
      expiresAt: new Date("2026-05-20T00:00:00.000Z")
    });

    const { resetRateLimitStore } = await import("@/lib/rate-limit");
    resetRateLimitStore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("rate limits password reset requests", async () => {
    getDbMock.mockReturnValue({
      user: {
        findUnique: vi.fn(async () => ({
          id: "user-1",
          email: "ana@example.com",
          name: "Ana",
          isActive: true
        }))
      }
    });

    const { requestPasswordResetAction } = await import("@/actions/account-security");
    const formData = new FormData();
    formData.set("email", "ana@example.com");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await requestPasswordResetAction({}, formData);
      expect(result.success).toContain("Si existe una cuenta activa");
    }

    const blockedResult = await requestPasswordResetAction({}, formData);

    expect(blockedResult.error).toContain("limite temporal de recuperacion");
    expect(sendPasswordResetEmailMock).toHaveBeenCalledTimes(3);
  });

  test("rate limits email verification resends", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "ana@example.com",
      name: "Ana",
      emailVerifiedAt: null
    });

    const { resendEmailVerificationAction } = await import("@/actions/account-security");
    const formData = new FormData();
    formData.set("nextPath", "/verificacion-pendiente");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await expect(resendEmailVerificationAction(formData)).rejects.toThrow(
        "REDIRECT:/verificacion-pendiente?sent=1"
      );
    }

    await expect(resendEmailVerificationAction(formData)).rejects.toThrow(
      "REDIRECT:/verificacion-pendiente?error=rate-limited"
    );
    expect(sendEmailVerificationEmailMock).toHaveBeenCalledTimes(3);
  });
});
