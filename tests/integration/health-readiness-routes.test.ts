const getReadinessReportMock = vi.fn();

vi.mock("@/lib/runtime-readiness", () => ({
  getReadinessReport: getReadinessReportMock
}));

describe("health and readiness routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("health route reports alive", async () => {
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "alive"
    });
  });

  test("readiness route returns 503 when not ready", async () => {
    getReadinessReportMock.mockResolvedValue({
      ok: false,
      status: "not_ready",
      timestamp: "2026-05-20T00:00:00.000Z",
      checks: {
        database: {
          ok: true
        },
        storage: {
          ok: false,
          reason: "storage-provider-not-explicit"
        },
        session: {
          ok: true
        },
        stripe: {
          ok: true
        }
      }
    });

    const { GET } = await import("@/app/api/readiness/route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      status: "not_ready"
    });
  });
});
