import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let parsed;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.recipientId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const recipient = await getDb().user.findUnique({
    where: { id: parsed.recipientId, isActive: true },
    select: { id: true },
  });
  if (!recipient) return NextResponse.json({ error: "Recipient not found" }, { status: 404 });

  const message = await getDb().directMessage.create({
    data: {
      senderId: user.id,
      recipientId: parsed.recipientId,
      body: parsed.body.trim(),
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      recipientId: true,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
