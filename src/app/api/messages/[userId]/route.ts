import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId: partnerId } = await params;

  const messages = await getDb().directMessage.findMany({
    where: {
      OR: [
        { senderId: user.id, recipientId: partnerId },
        { senderId: partnerId, recipientId: user.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, name: true } },
    },
  });

  // Mark incoming messages as read
  await getDb().directMessage.updateMany({
    where: {
      senderId: partnerId,
      recipientId: user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt,
      isMine: m.senderId === user.id,
      senderName: m.sender.name,
    }))
  );
}
