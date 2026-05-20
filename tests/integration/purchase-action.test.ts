const headersMock = vi.fn();
const getCatalogCourseBySlugMock = vi.fn();
const getCurrentUserMock = vi.fn();
const userOwnsCourseMock = vi.fn();
const createPendingPurchaseMock = vi.fn();
const grantCourseAccessMock = vi.fn();
const getPurchaseRuntimeModeMock = vi.fn();
const getStripeMock = vi.fn();
const getStripeRuntimeStateMock = vi.fn();
const captureOperationalWarningMock = vi.fn();
const captureOperationalInfoMock = vi.fn();
const captureServerExceptionMock = vi.fn();
const getDbMock = vi.fn();

vi.mock("next/headers", () => ({
  headers: headersMock
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((target: string) => {
    throw new Error(`REDIRECT:${target}`);
  })
}));

vi.mock("next/dist/client/components/redirect-error", () => ({
  isRedirectError: (error: unknown) =>
    error instanceof Error && error.message.startsWith("REDIRECT:")
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: getCurrentUserMock
}));

vi.mock("@/lib/course-catalog", () => ({
  getCatalogCourseBySlug: getCatalogCourseBySlugMock
}));

vi.mock("@/lib/purchases", () => ({
  createPendingPurchase: createPendingPurchaseMock,
  grantCourseAccess: grantCourseAccessMock,
  userOwnsCourse: userOwnsCourseMock
}));

vi.mock("@/lib/purchase-runtime", () => ({
  getPurchaseRuntimeMode: getPurchaseRuntimeModeMock
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: getStripeMock,
  getStripeRuntimeState: getStripeRuntimeStateMock
}));

vi.mock("@/lib/monitoring", () => ({
  captureOperationalWarning: captureOperationalWarningMock,
  captureOperationalInfo: captureOperationalInfoMock,
  captureServerException: captureServerExceptionMock
}));

vi.mock("@/lib/prisma", () => ({
  getDb: getDbMock
}));

describe("purchase action", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getCatalogCourseBySlugMock.mockResolvedValue({
      id: "course-1",
      slug: "curso-demo",
      title: "Curso demo",
      shortDescription: "Descripcion breve"
    });
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      email: "ana@example.com"
    });
    userOwnsCourseMock.mockResolvedValue(false);
    createPendingPurchaseMock.mockResolvedValue({
      id: "purchase-1",
      courseEditionId: null,
      promotionCode: null,
      totalInCents: 1000
    });
    getDbMock.mockReturnValue({
      purchase: {
        update: vi.fn(async () => null)
      }
    });
  });

  test("blocks checkout when Stripe is missing the webhook secret", async () => {
    getStripeRuntimeStateMock.mockReturnValue({
      mode: "misconfigured",
      hasSecretKey: true,
      hasWebhookSecret: false,
      reason: "missing-webhook-secret"
    });
    getPurchaseRuntimeModeMock.mockReturnValue("disabled");
    getStripeMock.mockReturnValue(null);

    const { startPurchaseAction } = await import("@/actions/purchase");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("courseEditionId", "");
    formData.set("promotionCode", "");

    const result = await startPurchaseAction({}, formData);

    expect(result).toEqual({
      error:
        "La compra esta bloqueada porque Stripe no tiene la configuracion completa de webhook en este entorno."
    });
    expect(createPendingPurchaseMock).not.toHaveBeenCalled();
    expect(grantCourseAccessMock).not.toHaveBeenCalled();
  });

  test("allows checkout when Stripe runtime is fully configured", async () => {
    getStripeRuntimeStateMock.mockReturnValue({
      mode: "live",
      hasSecretKey: true,
      hasWebhookSecret: true,
      reason: null,
      secretKey: "sk_test",
      webhookSecret: "whsec_test"
    });
    getPurchaseRuntimeModeMock.mockReturnValue("live");
    getStripeMock.mockReturnValue({
      checkout: {
        sessions: {
          create: vi.fn(async () => ({
            id: "cs_test_live",
            url: "https://checkout.stripe.test/session"
          }))
        }
      }
    });

    const { startPurchaseAction } = await import("@/actions/purchase");
    const formData = new FormData();
    formData.set("courseSlug", "curso-demo");
    formData.set("courseEditionId", "");
    formData.set("promotionCode", "");

    await expect(startPurchaseAction({}, formData)).rejects.toThrow(
      "REDIRECT:https://checkout.stripe.test/session"
    );
    expect(createPendingPurchaseMock).toHaveBeenCalledTimes(1);
  });
});
