import { NextResponse } from "next/server";
import { requireAdminConsoleUser } from "@/lib/admin-console-server";
import { getEnrollmentAccessState } from "@/lib/course-editions";
import { isDatabaseConnectionError } from "@/lib/db-errors";
import { isDemoUserId } from "@/lib/demo-auth";
import { getDb } from "@/lib/prisma";
import { summarizeProgress } from "@/components/admin/supervision/supervision-utils";

type ExportDataset = "enrollments" | "progress" | "submissions" | "grades";

function csvEscape(value: string) {
  return `"${value.replaceAll("\"", "\"\"")}"`;
}

function buildCsvResponse(filename: string, rows: string[]) {
  return new NextResponse(rows.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`
    }
  });
}

function getDatasetFilename(dataset: ExportDataset) {
  switch (dataset) {
    case "progress":
      return "supervision-progress.csv";
    case "submissions":
      return "supervision-submissions.csv";
    case "grades":
      return "supervision-grades.csv";
    default:
      return "supervision-enrollments.csv";
  }
}

export async function GET(request: Request) {
  const currentUser = await requireAdminConsoleUser("/admin/supervision");
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const courseId = searchParams.get("courseId")?.trim() ?? "ALL";
  const teacherId = searchParams.get("teacherId")?.trim() ?? "ALL";
  const accessState = searchParams.get("accessState")?.trim() ?? "ALL";
  const dataset = (searchParams.get("dataset")?.trim() ?? "enrollments") as ExportDataset;

  if (isDemoUserId(currentUser.id)) {
    return buildCsvResponse(getDatasetFilename(dataset), []);
  }

  try {
    const db = getDb();
    const enrollments = await db.courseEnrollment.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { user: { name: { contains: q } } },
                { user: { email: { contains: q } } },
                { course: { title: { contains: q } } }
              ]
            }
          : {}),
        ...(courseId !== "ALL" ? { courseId } : {}),
        ...(teacherId !== "ALL"
          ? {
              OR: [
                {
                  course: {
                    teacherAssignments: {
                      some: {
                        userId: teacherId
                      }
                    }
                  }
                },
                {
                  courseEdition: {
                    teacherAssignments: {
                      some: {
                        userId: teacherId
                      }
                    }
                  }
                }
              ]
            }
          : {})
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          }
        },
        course: {
          include: {
            modules: {
              orderBy: {
                position: "asc"
              }
            },
            teacherAssignments: {
              include: {
                user: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        courseEdition: {
          select: {
            id: true,
            label: true
          }
        },
        purchase: {
          select: {
            status: true,
            totalInCents: true,
            discountInCents: true,
            promotionCode: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      },
      take: 1000
    });

    const visibleEnrollments = enrollments
      .map((enrollment) => ({
        ...enrollment,
        accessState: getEnrollmentAccessState({
          status: enrollment.status,
          accessStartsAt: enrollment.accessStartsAt,
          accessUntil: enrollment.accessUntil
        })
      }))
      .filter((enrollment) => (accessState === "ALL" ? true : enrollment.accessState === accessState));

    const progressRecords = await db.courseModuleProgress.findMany({
      where: {
        userId: {
          in: Array.from(new Set(visibleEnrollments.map((enrollment) => enrollment.userId)))
        },
        courseSlug: {
          in: Array.from(new Set(visibleEnrollments.map((enrollment) => enrollment.course.slug)))
        }
      },
      select: {
        userId: true,
        courseSlug: true,
        moduleId: true,
        moduleIndex: true,
        completedAt: true
      }
    });

    const progressByEnrollmentId = new Map<string, ReturnType<typeof summarizeProgress>>();

    for (const enrollment of visibleEnrollments) {
      const records = progressRecords.filter(
        (record) => record.userId === enrollment.userId && record.courseSlug === enrollment.course.slug
      );

      progressByEnrollmentId.set(
        enrollment.id,
        summarizeProgress({
          totalModules: enrollment.course.modules.length,
          records
        })
      );
    }

    if (dataset === "enrollments") {
      const rows = [
        [
          "enrollment_id",
          "student_name",
          "student_email",
          "student_active",
          "course_title",
          "course_slug",
          "edition_label",
          "enrollment_status",
          "access_state",
          "access_starts_at",
          "access_until",
          "purchase_status",
          "purchase_total_in_cents",
          "discount_in_cents",
          "promotion_code",
          "teachers"
        ].join(","),
        ...visibleEnrollments.map((enrollment) =>
          [
            csvEscape(enrollment.id),
            csvEscape(enrollment.user.name),
            csvEscape(enrollment.user.email),
            csvEscape(String(enrollment.user.isActive)),
            csvEscape(enrollment.course.title),
            csvEscape(enrollment.course.slug),
            csvEscape(enrollment.courseEdition?.label ?? ""),
            csvEscape(enrollment.status),
            csvEscape(enrollment.accessState),
            csvEscape(enrollment.accessStartsAt.toISOString()),
            csvEscape(enrollment.accessUntil?.toISOString() ?? ""),
            csvEscape(enrollment.purchase?.status ?? ""),
            csvEscape(String(enrollment.purchase?.totalInCents ?? "")),
            csvEscape(String(enrollment.purchase?.discountInCents ?? "")),
            csvEscape(enrollment.purchase?.promotionCode ?? ""),
            csvEscape(
              enrollment.course.teacherAssignments.map((assignment) => assignment.user.name).join(" | ")
            )
          ].join(",")
        )
      ];

      return buildCsvResponse(getDatasetFilename(dataset), rows);
    }

    if (dataset === "progress") {
      const rows = [
        [
          "enrollment_id",
          "student_name",
          "student_email",
          "course_title",
          "course_slug",
          "edition_label",
          "enrollment_status",
          "access_state",
          "completed_modules",
          "total_modules",
          "completion_rate",
          "last_completed_at"
        ].join(","),
        ...visibleEnrollments.map((enrollment) => {
          const progress = progressByEnrollmentId.get(enrollment.id) ?? {
            completedModules: 0,
            totalModules: enrollment.course.modules.length,
            completionRate: 0,
            lastCompletedAt: null
          };

          return [
            csvEscape(enrollment.id),
            csvEscape(enrollment.user.name),
            csvEscape(enrollment.user.email),
            csvEscape(enrollment.course.title),
            csvEscape(enrollment.course.slug),
            csvEscape(enrollment.courseEdition?.label ?? ""),
            csvEscape(enrollment.status),
            csvEscape(enrollment.accessState),
            csvEscape(String(progress.completedModules)),
            csvEscape(String(progress.totalModules)),
            csvEscape(String(progress.completionRate)),
            csvEscape(progress.lastCompletedAt?.toISOString() ?? "")
          ].join(",");
        })
      ];

      return buildCsvResponse(getDatasetFilename(dataset), rows);
    }

    const enrollmentContextByStudentCourse = new Map<
      string,
      (typeof visibleEnrollments)[number]
    >();

    for (const enrollment of visibleEnrollments) {
      const key = `${enrollment.userId}:${enrollment.courseId}`;

      if (!enrollmentContextByStudentCourse.has(key)) {
        enrollmentContextByStudentCourse.set(key, enrollment);
      }
    }

    const submissions = await db.courseResourceSubmission.findMany({
      where: {
        studentId: {
          in: Array.from(new Set(visibleEnrollments.map((enrollment) => enrollment.userId)))
        },
        resource: {
          courseId: {
            in: Array.from(new Set(visibleEnrollments.map((enrollment) => enrollment.courseId)))
          }
        }
      },
      include: {
        student: {
          select: {
            name: true,
            email: true
          }
        },
        reviewer: {
          select: {
            name: true,
            email: true
          }
        },
        resource: {
          select: {
            id: true,
            title: true,
            dueAt: true,
            passingScore: true,
            module: {
              select: {
                title: true
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: {
        submittedAt: "desc"
      },
      take: 2000
    });

    const visibleSubmissions = submissions.filter((submission) =>
      enrollmentContextByStudentCourse.has(`${submission.studentId}:${submission.resource.course.id}`)
    );

    if (dataset === "submissions") {
      const rows = [
        [
          "submission_id",
          "course_title",
          "course_slug",
          "edition_label",
          "resource_id",
          "resource_title",
          "module_title",
          "student_name",
          "student_email",
          "status",
          "submitted_at",
          "reviewed_at",
          "has_body",
          "has_link",
          "has_attachment",
          "due_at",
          "reviewer_name"
        ].join(","),
        ...visibleSubmissions.map((submission) => {
          const enrollmentContext = enrollmentContextByStudentCourse.get(
            `${submission.studentId}:${submission.resource.course.id}`
          );

          return [
            csvEscape(submission.id),
            csvEscape(submission.resource.course.title),
            csvEscape(submission.resource.course.slug),
            csvEscape(enrollmentContext?.courseEdition?.label ?? ""),
            csvEscape(submission.resource.id),
            csvEscape(submission.resource.title),
            csvEscape(submission.resource.module?.title ?? ""),
            csvEscape(submission.student.name),
            csvEscape(submission.student.email),
            csvEscape(submission.status),
            csvEscape(submission.submittedAt.toISOString()),
            csvEscape(submission.reviewedAt?.toISOString() ?? ""),
            csvEscape(String(Boolean(submission.body?.trim()))),
            csvEscape(String(Boolean(submission.linkUrl?.trim()))),
            csvEscape(String(Boolean(submission.storageKey))),
            csvEscape(submission.resource.dueAt?.toISOString() ?? ""),
            csvEscape(submission.reviewer?.name ?? "")
          ].join(",");
        })
      ];

      return buildCsvResponse(getDatasetFilename(dataset), rows);
    }

    const gradeRows = visibleSubmissions
      .filter((submission) => typeof submission.score === "number")
      .map((submission) => {
        const enrollmentContext = enrollmentContextByStudentCourse.get(
          `${submission.studentId}:${submission.resource.course.id}`
        );
        const passingScore = submission.resource.passingScore;
        const passed =
          typeof passingScore === "number" && typeof submission.score === "number"
            ? submission.score >= passingScore
            : null;

        return [
          csvEscape(submission.id),
          csvEscape(submission.resource.course.title),
          csvEscape(submission.resource.course.slug),
          csvEscape(enrollmentContext?.courseEdition?.label ?? ""),
          csvEscape(submission.resource.title),
          csvEscape(submission.resource.module?.title ?? ""),
          csvEscape(submission.student.name),
          csvEscape(submission.student.email),
          csvEscape(String(submission.score ?? "")),
          csvEscape(String(passingScore ?? "")),
          csvEscape(
            passed === null ? "" : passed ? "passed" : "failed"
          ),
          csvEscape(submission.status),
          csvEscape(submission.reviewedAt?.toISOString() ?? ""),
          csvEscape(submission.reviewer?.name ?? ""),
          csvEscape(submission.feedback ?? "")
        ].join(",");
      });

    return buildCsvResponse(getDatasetFilename(dataset), [
      [
        "submission_id",
        "course_title",
        "course_slug",
        "edition_label",
        "resource_title",
        "module_title",
        "student_name",
        "student_email",
        "score",
        "passing_score",
        "result",
        "status",
        "reviewed_at",
        "reviewer_name",
        "feedback"
      ].join(","),
      ...gradeRows
    ]);
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    return buildCsvResponse(getDatasetFilename(dataset), []);
  }
}
