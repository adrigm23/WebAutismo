const jwtVerifyMock = vi.fn();

vi.mock("jose", () => ({
  jwtVerify: jwtVerifyMock
}));

describe("proxy route protection", () => {
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

  test("keeps the same protected and guest-only matcher coverage", async () => {
    const { config } = await import("@/proxy");

    expect(config.matcher).toEqual([
      "/mi-cuenta/:path*",
      "/mis-cursos/:path*",
      "/admin/:path*",
      "/acceder",
      "/registro"
    ]);
  });

  test("redirects unauthenticated users from protected alumno routes to login", async () => {
    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("https://example.com/mis-cursos/curso-1?tab=resources");

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://example.com/acceder?next=%2Fmis-cursos%2Fcurso-1%3Ftab%3Dresources"
    );
    expect(jwtVerifyMock).not.toHaveBeenCalled();
  });

  test("allows authenticated users through protected docente and admin routes", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "user-1"
      }
    });

    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    const teacherRequest = new NextRequest("https://example.com/mis-cursos/curso-1", {
      headers: {
        cookie: "academy_session=valid-token"
      }
    });
    const adminRequest = new NextRequest("https://example.com/admin", {
      headers: {
        cookie: "academy_session=valid-token"
      }
    });

    const teacherResponse = await proxy(teacherRequest);
    const adminResponse = await proxy(adminRequest);

    expect(teacherResponse.status).toBe(200);
    expect(adminResponse.status).toBe(200);
    expect(jwtVerifyMock).toHaveBeenCalledTimes(2);
  });

  test("redirects authenticated guests away from guest-only routes", async () => {
    jwtVerifyMock.mockResolvedValue({
      payload: {
        sub: "user-1"
      }
    });

    const { NextRequest } = await import("next/server");
    const { proxy } = await import("@/proxy");
    const request = new NextRequest("https://example.com/acceder", {
      headers: {
        cookie: "academy_session=valid-token"
      }
    });

    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/mi-cuenta");
  });
});
