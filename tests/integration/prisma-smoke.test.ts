import { getDb } from "@/lib/prisma";

const runDbIntegration = process.env.RUN_DB_INTEGRATION === "true";

describe("prisma integration", () => {
  const maybeTest = runDbIntegration ? test : test.skip;

  maybeTest("connects and can execute a basic query", async () => {
    const db = getDb();
    const result = await db.$queryRaw<Array<{ value: number }>>`SELECT 1 as value`;

    expect(result[0]?.value).toBe(1);
  });
});
