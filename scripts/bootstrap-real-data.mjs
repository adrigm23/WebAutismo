import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { bootstrapCatalogFromLegacyIfNeeded } from "../src/lib/course-catalog.ts";

const db = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  throw new Error("bootstrap-real-data.mjs solo puede ejecutarse en entornos locales o de desarrollo.");
}

const DEFAULT_PASSWORD = process.env.LOCAL_BOOTSTRAP_PASSWORD?.trim();

if (!DEFAULT_PASSWORD) {
  throw new Error("LOCAL_BOOTSTRAP_PASSWORD es obligatoria para ejecutar el bootstrap real.");
}

const TEST_USERS = {
  admin: {
    name: "Admin Autismo",
    email: "admin@autismocordoba.local",
    role: "ADMIN"
  },
  teacher: {
    name: "Docente Real",
    email: "docente@autismocordoba.local",
    role: "TEACHER"
  },
  student: {
    name: "Alumno Real",
    email: "alumno@autismocordoba.local",
    role: "STUDENT"
  }
};

function calculateAmounts(subtotalInCents, discountInCents) {
  const taxableBase = Math.max(subtotalInCents - discountInCents, 0);
  const taxInCents = Math.round(taxableBase * 0.21);

  return {
    subtotalInCents,
    discountInCents,
    taxInCents,
    totalInCents: taxableBase + taxInCents
  };
}

async function upsertUser(input) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  return db.user.upsert({
    where: {
      email: input.email
    },
    update: {
      name: input.name,
      globalRole: input.role,
      isActive: true,
      deactivatedAt: null,
      deactivatedById: null,
      passwordHash
    },
    create: {
      name: input.name,
      email: input.email,
      globalRole: input.role,
      isActive: true,
      passwordHash,
      notificationPreference: {
        create: {
          emailEnabled: true,
          webEnabled: true
        }
      }
    }
  });
}

async function ensureNotificationPreference(userId) {
  await db.notificationPreference.upsert({
    where: {
      userId
    },
    update: {
      emailEnabled: true,
      webEnabled: true
    },
    create: {
      userId,
      emailEnabled: true,
      webEnabled: true
    }
  });
}

async function ensurePromotion({ adminUserId, courseId }) {
  return db.promotion.upsert({
    where: {
      code: "BIENVENIDA10"
    },
    update: {
      description: "Descuento de bienvenida para pruebas reales.",
      discountType: "PERCENTAGE",
      amountInCents: 10,
      isActive: true,
      scope: "COURSE",
      courseId,
      createdById: adminUserId,
      updatedById: adminUserId,
      validFrom: null,
      validUntil: null,
      usageLimit: 100
    },
    create: {
      code: "BIENVENIDA10",
      description: "Descuento de bienvenida para pruebas reales.",
      discountType: "PERCENTAGE",
      amountInCents: 10,
      isActive: true,
      scope: "COURSE",
      courseId,
      createdById: adminUserId,
      updatedById: adminUserId,
      usageLimit: 100
    }
  });
}

async function ensureAuditLog(input) {
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

async function main() {
  await bootstrapCatalogFromLegacyIfNeeded();

  const [admin, teacher, student] = await Promise.all([
    upsertUser(TEST_USERS.admin),
    upsertUser(TEST_USERS.teacher),
    upsertUser(TEST_USERS.student)
  ]);

  await Promise.all([
    ensureNotificationPreference(admin.id),
    ensureNotificationPreference(teacher.id),
    ensureNotificationPreference(student.id)
  ]);

  const course = await db.course.findFirst({
    include: {
      modules: {
        orderBy: {
          position: "asc"
        }
      },
      editions: {
        orderBy: {
          editionNumber: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });

  if (!course) {
    throw new Error("No hay cursos disponibles tras el bootstrap del catalogo.");
  }

  const edition =
    course.editions.find((item) => item.status === "ACTIVE" && item.isActive) ??
    course.editions[0] ??
    null;

  if (!edition) {
    throw new Error("El curso de prueba no tiene ninguna edicion creada.");
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

  const promotion = await ensurePromotion({
    adminUserId: admin.id,
    courseId: course.id
  });

  const amounts = calculateAmounts(course.priceInCents, Math.round(course.priceInCents * 0.1));

  const purchase = await db.purchase.upsert({
    where: {
      stripeCheckoutSessionId: `seed-${student.id}-${course.slug}`
    },
    update: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      status: "PAID",
      subtotalInCents: amounts.subtotalInCents,
      discountInCents: amounts.discountInCents,
      taxInCents: amounts.taxInCents,
      totalInCents: amounts.totalInCents,
      promotionId: promotion.id,
      promotionCode: promotion.code,
      courseSlugSnapshot: course.slug,
      courseTitleSnapshot: course.title
    },
    create: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      status: "PAID",
      subtotalInCents: amounts.subtotalInCents,
      discountInCents: amounts.discountInCents,
      taxInCents: amounts.taxInCents,
      totalInCents: amounts.totalInCents,
      promotionId: promotion.id,
      promotionCode: promotion.code,
      stripeCheckoutSessionId: `seed-${student.id}-${course.slug}`,
      stripePaymentIntentId: `seed-pi-${student.id}-${course.id}`,
      courseSlugSnapshot: course.slug,
      courseTitleSnapshot: course.title
    }
  });

  await db.promotionRedemption.upsert({
    where: {
      purchaseId: purchase.id
    },
    update: {
      promotionId: promotion.id,
      userId: student.id,
      courseId: course.id,
      discountInCents: amounts.discountInCents
    },
    create: {
      promotionId: promotion.id,
      purchaseId: purchase.id,
      userId: student.id,
      courseId: course.id,
      discountInCents: amounts.discountInCents
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
      notes: "Matricula real de prueba creada para validacion local."
    },
    create: {
      userId: student.id,
      courseId: course.id,
      courseEditionId: edition.id,
      purchaseId: purchase.id,
      status: "ACTIVE",
      accessStartsAt: new Date(),
      accessUntil: edition.accessUntil,
      notes: "Matricula real de prueba creada para validacion local."
    }
  });

  await db.courseMembership.upsert({
    where: {
      userId_courseSlug: {
        userId: teacher.id,
        courseSlug: course.slug
      }
    },
    update: {
      role: "TEACHER"
    },
    create: {
      userId: teacher.id,
      courseSlug: course.slug,
      role: "TEACHER"
    }
  });

  await db.courseMembership.upsert({
    where: {
      userId_courseSlug: {
        userId: student.id,
        courseSlug: course.slug
      }
    },
    update: {
      role: "STUDENT"
    },
    create: {
      userId: student.id,
      courseSlug: course.slug,
      role: "STUDENT"
    }
  });

  for (const courseModule of course.modules.slice(0, Math.min(2, course.modules.length))) {
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

  await db.userNotification.create({
    data: {
      userId: student.id,
      category: "PURCHASE",
      title: `Compra confirmada: ${course.title}`,
      body: "Tu acceso de prueba ya esta activo y queda guardado en la base real.",
      linkPath: `/mis-cursos/${course.slug}`,
      metadataJson: JSON.stringify({
        purchaseId: purchase.id,
        enrollmentId: enrollment.id
      })
    }
  });

  await ensureAuditLog({
    actorId: admin.id,
    action: "USER_CREATED",
    entityType: "USER",
    entityId: teacher.id,
    entityLabel: teacher.email,
    metadata: {
      globalRole: teacher.globalRole
    }
  });

  await ensureAuditLog({
    actorId: admin.id,
    action: "COURSE_TEACHER_ASSIGNED",
    entityType: "COURSE",
    entityId: course.id,
    entityLabel: course.title,
    metadata: {
      teacherEmail: teacher.email
    }
  });

  await ensureAuditLog({
    actorId: student.id,
    action: "PURCHASE_PAID",
    entityType: "PURCHASE",
    entityId: purchase.id,
    entityLabel: course.title,
    metadata: {
      courseSlug: course.slug,
      totalInCents: purchase.totalInCents,
      discountInCents: purchase.discountInCents
    }
  });

  console.log("Bootstrap real completado.");
  console.log(`Admin: ${admin.email}`);
  console.log(`Docente: ${teacher.email}`);
  console.log(`Alumno: ${student.email}`);
  console.log(`Curso de prueba: ${course.title}`);
  console.log(`Cupon activo: ${promotion.code}`);
  console.log("Las credenciales se definieron mediante LOCAL_BOOTSTRAP_PASSWORD y no se muestran en consola.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
