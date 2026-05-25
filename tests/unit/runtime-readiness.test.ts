const getDbMock = vi.fn();
const getStripeRuntimeStateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

vi.mock("@/lib/stripe", () => ({
  getStripeRuntimeState: getStripeRuntimeStateMock
}));

describe("runtime readiness", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      SESSION_SECRET: "test-session-secret",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000"
    };

    getDbMock.mockReturnValue({
      $queryRaw: vi.fn(async () => 1)
    });
    getStripeRuntimeStateMock.mockReturnValue({
      mode: "disabled",
      hasSecretKey: false,
      hasWebhookSecret: false
    });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("treats implicit database storage as ready in local environments", async () => {
    delete process.env.OBJECT_STORAGE_PROVIDER;
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;

    const { getReadinessReport } = await import("@/lib/runtime-readiness");
    const report = await getReadinessReport();

    expect(report.ok).toBe(true);
    expect(report.status).toBe("ready");
    expect(report.checks.storage).toMatchObject({
      ok: true,
      details: {
        configuredProvider: null,
        effectiveProvider: "database",
        mode: "implicit-local-database-fallback"
      }
    });
  });

  test("keeps deployed environments not ready when storage provider is not explicit", async () => {
    delete process.env.OBJECT_STORAGE_PROVIDER;
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "preview";

    const { getReadinessReport } = await import("@/lib/runtime-readiness");
    const report = await getReadinessReport();

    expect(report.ok).toBe(false);
    expect(report.status).toBe("not_ready");
    expect(report.checks.storage).toMatchObject({
      ok: false,
      reason: "storage-provider-not-explicit",
      details: {
        effectiveProvider: "database",
        requiredInDeployedEnvironments: true
      }
    });
  });
});
