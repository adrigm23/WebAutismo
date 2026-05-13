import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const COURSE_SLUG = "curso-prueba-flujo-campus-mayo-2026";
const COURSE_TITLE = "Curso de prueba para validar campus y seguimiento";
const COURSE_SHORT_DESCRIPTION =
  "Curso operativo de prueba para revisar acceso privado, seguimiento, recursos y entregas.";
const TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL?.trim().toLowerCase() || "docente@autismocordoba.local";
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL?.trim().toLowerCase() || "alumno@autismocordoba.local";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL?.trim().toLowerCase() || "admin@autismocordoba.local";

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function writeAuditLog(input) {
  await db.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel ?? null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null
    }
  });
}

async function ensureCourse() {
  const existing = await db.course.findUnique({
    where: {
      slug: COURSE_SLUG
    },
    include: {
      editions: {
        orderBy: {
          editionNumber: "asc"
        }
      },
      modules: {
        orderBy: {
          position: "asc"
        }
      }
    }
  });

  if (existing) {
    return existing;
  }

  return db.course.create({
    data: {
      slug: COURSE_SLUG,
      title: COURSE_TITLE,
      shortDescription: COURSE_SHORT_DESCRIPTION,
      description:
        "Curso de prueba creado para validar dashboards, asignaciones, seguimiento, recursos y experiencia privada.",
      priceInCents: 12900,
      duration: "4 semanas",
      format: "Campus online",
      level: "Aplicado",
      accentFrom: "#0b6357",
      accentTo: "#f08968",
      category: "Pruebas",
      audienceJson: ["Docentes", "Profesionales", "Validacion interna"],
      outcomesJson: [
        "Comprobar acceso privado por roles",
        "Validar seguimiento por alumno",
        "Revisar recursos y ejercicios"
      ],
      methodologyJson: [
        "Modulos asimetricos de prueba",
        "Entrega y revision docente",
        "Foro privado por curso"
      ],
      faqJson: [],
      seoTitle: COURSE_TITLE,
      seoDescription: COURSE_SHORT_DESCRIPTION,
      status: "ACTIVE",
      modules: {
        create: [
          {
            moduleKey: "fundamentos-prueba",
            title: "Fundamentos de prueba",
            description: "Modulo base para verificar el acceso al campus.",
            estimatedTime: "20 min",
            resourcesSummary: "Lectura y material de arranque",
            position: 0
          },
          {
            moduleKey: "seguimiento-prueba",
            title: "Seguimiento y progreso",
            description: "Modulo para validar marcas de progreso y supervision.",
            estimatedTime: "30 min",
            resourcesSummary: "Checklist y ejemplo de avance",
            position: 1
          },
          {
            moduleKey: "entregas-prueba",
            title: "Entregas y revision",
            description: "Modulo para probar ejercicios, feedback y calificacion.",
            estimatedTime: "35 min",
            resourcesSummary: "Ejercicio y entrega asociada",
            position: 2
          }
        ]
      },
      editions: {
        create: {
          label: "Edicion de prueba Mayo 2026",
          editionNumber: 1,
          status: "ACTIVE",
          isActive: true,
          graceAccessDays: 30,
          startsAt: new Date(),
          endsAt: addDays(new Date(), 30),
          accessUntil: addDays(new Date(), 60)
        }
      }
    },
    include: {
      editions: {
        orderBy: {
          editionNumber: "asc"
        }
      },
      modules: {
        orderBy: {
          position: "asc"
        }
      }
    }
  });
}

async function main() {
  const [admin, teacher, student] = await Promise.all([
    db.user.findUnique({ where: { email: ADMIN_EMAIL } }),
    db.user.findUnique({ where: { email: TEACHER_EMAIL } }),
    db.user.findUnique({ where: { email: STUDENT_EMAIL } })
  ]);

  if (!teacher) {
    throw new Error(`No existe el docente ${TEACHER_EMAIL}.`);
  }

  if (!student) {
    throw new Error(`No existe el alumno ${STUDENT_EMAIL}.`);
  }

  if (teacher.globalRole === "STUDENT") {
    await db.user.update({
      where: { id: teacher.id },
      data: { globalRole: "TEACHER" }
    });
  }

  const course = await ensureCourse();
  const edition = course.editions[0];

  if (!edition) {
    throw new Error("El curso de prueba no tiene edicion activa.");
  }

  await db.courseTeacherAssignment.upsert({
    where: {
      courseId_userId: {
        courseId: course.id,
        userId: teacher.id
      }
    },
    update: {},
    create: {
      courseId: course.id,
      userId: teacher.id
    }
  });

  await db.courseEditionTeacherAssignment.upsert({
    where: {
      courseEditionId_userId: {
        courseEditionId: edition.id,
        userId: teacher.id
      }
    },
    update: {},
    create: {
      courseEditionId: edition.id,
      userId: teacher.id
    }
  });

  const purchase = await db.purchase.upsert({
    where: {
      stripeCheckoutSessionId: `seed-${student.id}-${COURSE_SLUG}`
    },
    update: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      status: "PAID",
      subtotalInCents: course.priceInCents,
      discountInCents: 0,
      taxInCents: 0,
      totalInCents: course.priceInCents,
      courseSlugSnapshot: course.slug,
      courseTitleSnapshot: course.title
    },
    create: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      status: "PAID",
      subtotalInCents: course.priceInCents,
      discountInCents: 0,
      taxInCents: 0,
      totalInCents: course.priceInCents,
      stripeCheckoutSessionId: `seed-${student.id}-${COURSE_SLUG}`,
      stripePaymentIntentId: `seed-pi-${student.id}-${course.id}`,
      courseSlugSnapshot: course.slug,
      courseTitleSnapshot: course.title
    }
  });

  const enrollment = await db.courseEnrollment.upsert({
    where: {
      purchaseId: purchase.id
    },
    update: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      status: "ACTIVE",
      accessStartsAt: new Date(),
      accessUntil: edition.accessUntil,
      deactivatedAt: null,
      deactivatedById: null,
      notes: "Matricula de prueba para validacion funcional."
    },
    create: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      purchaseId: purchase.id,
      status: "ACTIVE",
      accessStartsAt: new Date(),
      accessUntil: edition.accessUntil,
      notes: "Matricula de prueba para validacion funcional."
    }
  });

  for (const courseModule of course.modules.slice(0, 1)) {
    await db.courseModuleProgress.upsert({
      where: {
        userId_courseSlug_moduleId: {
          userId: student.id,
          courseSlug: course.slug,
          moduleId: courseModule.moduleKey
        }
      },
      update: {
        moduleIndex: courseModule.position,
        completedAt: new Date()
      },
      create: {
        userId: student.id,
        courseSlug: course.slug,
        moduleId: courseModule.moduleKey,
        moduleIndex: courseModule.position,
        completedAt: new Date()
      }
    });
  }

  await db.notificationPreference.upsert({
    where: {
      userId: student.id
    },
    update: {},
    create: {
      userId: student.id
    }
  });

  if (admin) {
    await writeAuditLog({
      actorId: admin.id,
      action: "COURSE_CREATED",
      entityType: "COURSE",
      entityId: course.id,
      entityLabel: course.title,
      metadata: {
        slug: course.slug,
        seeded: true
      }
    });

    await writeAuditLog({
      actorId: admin.id,
      action: "COURSE_TEACHER_ASSIGNED",
      entityType: "COURSE",
      entityId: course.id,
      entityLabel: course.title,
      metadata: {
        teacherEmail: teacher.email
      }
    });
  }

  console.log("Curso de prueba listo.");
  console.log(`Curso: ${course.title} (${course.slug})`);
  console.log(`Docente asignado: ${teacher.email}`);
  console.log(`Alumno matriculado: ${student.email}`);
  console.log(`Matricula: ${enrollment.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
