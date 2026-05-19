import type { AuditAction, AuditEntityType } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { demoAdminAuditLogs } from "@/lib/admin-demo";
import { parseAuditMetadata } from "@/lib/audit";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";

function csvEscape(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function buildCsvResponse(rows: string[]) {
  return new NextResponse(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="audit-log.csv"'
    }
  });
}

export async function GET(request: Request) {
  const currentUser = await requireAdminConsoleUser("/admin/audit");
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

  const headerRow = [
    "timestamp",
    "action",
    "entity_type",
    "entity_id",
    "entity_label",
    "actor_name",
    "actor_email",
    "metadata"
  ].join(",");

  if (isDemoUserId(currentUser.id)) {
    const logs = demoAdminAuditLogs.filter((log) => {
      const matchesQ =
        !q ||
        log.entityLabel.toLowerCase().includes(q.toLowerCase()) ||
        log.actor.name.toLowerCase().includes(q.toLowerCase());
      const matchesRange = !rangeStart || log.createdAt >= rangeStart;
      const matchesActor = actorId === "ALL" || actorId === currentUser.id;
      const matchesAction = action === "ALL" || log.action === action;
      const matchesEntity = entity === "ALL" || log.entityType === entity;

      return matchesQ && matchesRange && matchesActor && matchesAction && matchesEntity;
    });

    return buildCsvResponse([
      headerRow,
      ...logs.map((log) =>
        [
          csvEscape(log.createdAt.toISOString()),
          csvEscape(log.action),
          csvEscape(log.entityType),
          csvEscape(log.entityId),
          csvEscape(log.entityLabel ?? ""),
          csvEscape(log.actor.name),
          csvEscape(log.actor.email),
          csvEscape(JSON.stringify(log.metadata ?? {}))
        ].join(",")
      )
    ]);
  }

  try {
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

    return buildCsvResponse([
      headerRow,
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
    ]);
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    return NextResponse.json(
      {
        error: "Audit export is temporarily unavailable because the database connection failed."
      },
      { status: 503 }
    );
  }
}
