describe("demo auth", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: "test" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("returns no demo users when demo auth is disabled", async () => {
    delete process.env.DEMO_AUTH_ENABLED;
    delete process.env.DEMO_AUTH_PASSWORD;

    const demoAuth = await import("@/lib/demo-auth");

    expect(demoAuth.getDemoUsers()).toEqual([]);
    expect(demoAuth.getDemoUserByEmail("admin.demo@autismo.local")).toBeNull();
    expect(demoAuth.isValidDemoPassword("demo-pass")).toBe(false);
  });

  test("requires a configured demo password when demo auth is enabled", async () => {
    process.env.DEMO_AUTH_ENABLED = "true";
    delete process.env.DEMO_AUTH_PASSWORD;

    const demoAuth = await import("@/lib/demo-auth");

    expect(() => demoAuth.getDemoPassword()).toThrow(
      "Missing required environment variable: DEMO_AUTH_PASSWORD"
    );
  });

  test("resolves demo users only in explicit local demo mode", async () => {
    process.env.DEMO_AUTH_ENABLED = "true";
    process.env.DEMO_AUTH_PASSWORD = "super-secret-demo";
    process.env.NODE_ENV = "production";

    const demoAuth = await import("@/lib/demo-auth");

    expect(demoAuth.getDemoUsers()).toHaveLength(3);
    expect(demoAuth.getDemoUserByEmail("admin.demo@autismo.local")?.id).toBe("demo-admin");
    expect(demoAuth.isValidDemoPassword("super-secret-demo")).toBe(true);
  });

  test("disables demo auth in hosted deployments even if explicitly enabled", async () => {
    process.env.DEMO_AUTH_ENABLED = "true";
    process.env.DEMO_AUTH_PASSWORD = "super-secret-demo";
    process.env.VERCEL = "1";
    process.env.VERCEL_ENV = "production";

    const demoAuth = await import("@/lib/demo-auth");

    expect(demoAuth.getDemoUsers()).toEqual([]);
    expect(demoAuth.getDemoUserByEmail("admin.demo@autismo.local")).toBeNull();
    expect(demoAuth.isValidDemoPassword("super-secret-demo")).toBe(false);
  });
});
