import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const users = await getDb().user.findMany({
    where: {
      isActive: true,
      id: { not: user.id },
      name: { contains: q },
    },
    select: { id: true, name: true, globalRole: true },
    take: 8,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
