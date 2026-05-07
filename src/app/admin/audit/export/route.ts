import type { AuditAction, AuditEntityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { parseAuditMetadata } from "@/lib/audit";
import { getDb } from "@/lib/prisma";

function csvEscape(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

export async function GET(request: Request) {
  await requireAdminConsoleUser("/admin/audit");
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const range = searchParams.get("range")?.trim() ?? "7d";
  const actorId = searchParams.get("actorId")?.trim() ?? "ALL";
  const action = searchParams.get("action")?.trim() ?? "ALL";
  const entity = searchParams.get("entity")?.trim() ?? "ALL";
  const rangeStart =
    range === "30d"
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : range === "7d"
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : null;

  const logs = await getDb().auditLog.findMany({
    where: {
      ...(q
        ? {
            OR: [
              { entityLabel: { contains: q } },
              { entityId: { contains: q } },
              { actor: { name: { contains: q } } }
            ]
          }
        : {}),
      ...(rangeStart
        ? {
            createdAt: {
              gte: rangeStart
            }
          }
        : {}),
      ...(actorId !== "ALL" ? { actorId } : {}),
      ...(action !== "ALL" ? { action: action as AuditAction } : {}),
      ...(entity !== "ALL" ? { entityType: entity as AuditEntityType } : {})
    },
    include: {
      actor: {
        select: {
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 500
  });

  const rows = [
    ["timestamp", "action", "entity_type", "entity_id", "entity_label", "actor_name", "actor_email", "metadata"].join(","),
    ...logs.map((log) =>
      [
        csvEscape(log.createdAt.toISOString()),
        csvEscape(log.action),
        csvEscape(log.entityType),
        csvEscape(log.entityId),
        csvEscape(log.entityLabel ?? ""),
        csvEscape(log.actor?.name ?? "Sistema"),
        csvEscape(log.actor?.email ?? ""),
        csvEscape(JSON.stringify(parseAuditMetadata(log.metadataJson) ?? {}))
      ].join(",")
    )
  ];

  return new NextResponse(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="audit-log.csv"'
    }
  });
}
