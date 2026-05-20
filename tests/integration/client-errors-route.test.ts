const captureServerExceptionMock = vi.fn();

vi.mock("@/lib/monitoring", async () => {
  const actual = await vi.importActual<typeof import("@/lib/monitoring")>("@/lib/monitoring");
  return {
    ...actual,
    captureServerException: captureServerExceptionMock
  };
});

describe("client errors route", () => {
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NODE_ENV: "test",
      RATE_LIMIT_BACKEND: "memory"
    };

    const { resetRateLimitStore } = await import("@/lib/rate-limit");
    resetRateLimitStore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("rate limits repeated client error reports", async () => {
    const { POST } = await import("@/app/api/monitoring/client-errors/route");
    const makeRequest = () =>
      new Request("http://localhost/api/monitoring/client-errors", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "127.0.0.1",
          "user-agent": "Vitest"
        },
        body: JSON.stringify({
          message: "boom"
        })
      });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
    }

    const blockedResponse = await POST(makeRequest());

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers.get("retry-after")).toBeTruthy();
    await expect(blockedResponse.json()).resolves.toEqual({
      ok: false,
      error: "rate_limited"
    });
    expect(captureServerExceptionMock).toHaveBeenCalledTimes(20);
  });
});
