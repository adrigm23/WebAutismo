import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const messages = await getDb().directMessage.findMany({
    where: {
      OR: [{ senderId: user.id }, { recipientId: user.id }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true } },
      recipient: { select: { id: true, name: true } },
    },
  });

  // Build conversation list grouped by partner
  const seen = new Map<
    string,
    {
      partnerId: string;
      partnerName: string;
      lastMessage: string;
      lastTime: Date;
      unreadCount: number;
    }
  >();

  for (const msg of messages) {
    const partnerId = msg.senderId === user.id ? msg.recipientId : msg.senderId;
    const partnerName =
      msg.senderId === user.id ? msg.recipient.name : msg.sender.name;
    if (!seen.has(partnerId)) {
      const unreadCount = messages.filter(
        (m) =>
          m.senderId === partnerId &&
          m.recipientId === user.id &&
          !m.readAt
      ).length;
      seen.set(partnerId, {
        partnerId,
        partnerName,
        lastMessage: msg.body.slice(0, 60),
        lastTime: msg.createdAt,
        unreadCount,
      });
    }
  }

  return NextResponse.json(Array.from(seen.values()));
}
