export const demoAdminTeachers = [
  {
    id: "demo-teacher-maria",
    name: "Maria Rodriguez",
    email: "m.rodriguez@autismocordoba.demo",
    roleLabel: "Docente titular",
    activeStudents: 82,
    activeEditions: 3,
    createdAt: new Date("2024-03-12T09:00:00.000Z"),
    updatedAt: new Date("2026-05-08T08:40:00.000Z"),
    courseAssignments: [
      {
        id: "demo-course-acompanamiento",
        title: "Estrategias de intervencion temprana",
        slug: "estrategias-intervencion-temprana",
        editions: ["Edicion Otono 2024"]
      },
      {
        id: "demo-course-comunicacion",
        title: "Comunicacion aumentativa y alternativa",
        slug: "comunicacion-aumentativa-alternativa",
        editions: ["Edicion Continua"]
      },
      {
        id: "demo-course-conductual",
        title: "Manejo conductual en aula",
        slug: "manejo-conductual-en-aula",
        editions: ["Proxima edicion"]
      }
    ]
  },
  {
    id: "demo-teacher-juan",
    name: "Juan Gomez",
    email: "j.gomez@autismocordoba.demo",
    roleLabel: "Docente adjunto",
    activeStudents: 45,
    activeEditions: 2,
    createdAt: new Date("2024-04-03T09:00:00.000Z"),
    updatedAt: new Date("2026-05-08T08:15:00.000Z"),
    courseAssignments: [
      {
        id: "demo-course-acompanamiento",
        title: "Estrategias de intervencion temprana",
        slug: "estrategias-intervencion-temprana",
        editions: ["Edicion Otono 2024"]
      },
      {
        id: "demo-course-conductual",
        title: "Manejo conductual en aula",
        slug: "manejo-conductual-en-aula",
        editions: ["Proxima edicion"]
      }
    ]
  },
  {
    id: "demo-teacher-laura",
    name: "Laura Sanchez",
    email: "l.sanchez@autismocordoba.demo",
    roleLabel: "Docente",
    activeStudents: 60,
    activeEditions: 2,
    createdAt: new Date("2024-06-10T09:00:00.000Z"),
    updatedAt: new Date("2026-05-07T17:20:00.000Z"),
    courseAssignments: [
      {
        id: "demo-course-comunicacion",
        title: "Comunicacion aumentativa y alternativa",
        slug: "comunicacion-aumentativa-alternativa",
        editions: ["Edicion Continua"]
      },
      {
        id: "demo-course-aula",
        title: "Ajustes razonables en el aula",
        slug: "ajustes-razonables-aula",
        editions: ["Edicion Primavera 2025"]
      }
    ]
  }
] as const;

export const demoAdminCourses = [
  {
    id: "demo-course-acompanamiento",
    title: "Estrategias de intervencion temprana",
    slug: "estrategias-intervencion-temprana",
    shortDescription: "Recursos aplicados para deteccion, apoyo y acompanamiento familiar.",
    priceInCents: 18900,
    status: "ACTIVE",
    modules: 8,
    editions: 2,
    activeEditions: 1,
    teachers: ["Maria Rodriguez", "Juan Gomez"]
  },
  {
    id: "demo-course-comunicacion",
    title: "Comunicacion aumentativa y alternativa",
    slug: "comunicacion-aumentativa-alternativa",
    shortDescription: "Sistemas de apoyo para mejorar comprension, expresion y participacion.",
    priceInCents: 22000,
    status: "ACTIVE",
    modules: 10,
    editions: 1,
    activeEditions: 1,
    teachers: ["Maria Rodriguez", "Laura Sanchez"]
  },
  {
    id: "demo-course-aula",
    title: "Ajustes razonables en el aula",
    slug: "ajustes-razonables-aula",
    shortDescription: "Orientaciones practicas para inclusion real en entornos educativos.",
    priceInCents: 14900,
    status: "INACTIVE",
    modules: 6,
    editions: 1,
    activeEditions: 0,
    teachers: []
  }
] as const;

export const demoAdminEditions = [
  {
    id: "demo-edition-otono",
    courseId: "demo-course-acompanamiento",
    courseTitle: "Estrategias de intervencion temprana",
    label: "Edicion Otono 2024",
    status: "ACTIVE",
    startsAt: new Date("2024-09-15T09:00:00.000Z"),
    endsAt: new Date("2024-12-15T18:00:00.000Z"),
    accessUntil: new Date("2025-01-15T18:00:00.000Z"),
    graceAccessDays: 30,
    isActive: true,
    enrollments: 82
  },
  {
    id: "demo-edition-continua",
    courseId: "demo-course-comunicacion",
    courseTitle: "Comunicacion aumentativa y alternativa",
    label: "Edicion Continua",
    status: "SCHEDULED",
    startsAt: new Date("2025-02-01T09:00:00.000Z"),
    endsAt: new Date("2025-06-30T18:00:00.000Z"),
    accessUntil: new Date("2025-07-30T18:00:00.000Z"),
    graceAccessDays: 30,
    isActive: true,
    enrollments: 45
  },
  {
    id: "demo-edition-primavera",
    courseId: "demo-course-aula",
    courseTitle: "Ajustes razonables en el aula",
    label: "Edicion Primavera 2025",
    status: "CLOSED",
    startsAt: new Date("2025-03-01T09:00:00.000Z"),
    endsAt: new Date("2025-05-30T18:00:00.000Z"),
    accessUntil: new Date("2025-06-20T18:00:00.000Z"),
    graceAccessDays: 21,
    isActive: false,
    enrollments: 31
  }
] as const;

export const demoAdminPromotions = [
  {
    id: "demo-promo-otono",
    code: "OTONO24",
    description: "Promocion estacional para nuevas altas",
    discountType: "PERCENTAGE",
    amountInCents: 20,
    scope: "GLOBAL",
    courseId: null,
    courseTitle: null,
    validFrom: new Date("2024-09-01T00:00:00.000Z"),
    validUntil: new Date("2024-11-30T23:59:00.000Z"),
    usageLimit: 100,
    redemptionCount: 45,
    isActive: true
  },
  {
    id: "demo-promo-bienvenida",
    code: "BIENVENIDA50",
    description: "Descuento fijo para primer curso",
    discountType: "FIXED_AMOUNT",
    amountInCents: 5000,
    scope: "COURSE",
    courseId: "demo-course-acompanamiento",
    courseTitle: "Estrategias de intervencion temprana",
    validFrom: new Date("2024-10-01T00:00:00.000Z"),
    validUntil: null,
    usageLimit: null,
    redemptionCount: 18,
    isActive: true
  },
  {
    id: "demo-promo-cupo",
    code: "CIERRE10",
    description: "Promocion agotada de ejemplo",
    discountType: "PERCENTAGE",
    amountInCents: 10,
    scope: "GLOBAL",
    courseId: null,
    courseTitle: null,
    validFrom: new Date("2024-08-01T00:00:00.000Z"),
    validUntil: new Date("2024-10-20T23:59:00.000Z"),
    usageLimit: 10,
    redemptionCount: 10,
    isActive: true
  }
] as const;

export const demoAdminAuditLogs = [
  {
    id: "demo-audit-1",
    action: "COURSE_UPDATED",
    entityType: "COURSE",
    entityId: "demo-course-acompanamiento",
    entityLabel: "Estrategias de intervencion temprana",
    createdAt: new Date("2026-05-08T09:10:00.000Z"),
    actor: { name: "Admin Demo", email: "admin.demo@autismo.local" },
    metadata: {
      field: "priceInCents",
      previousValue: 17900,
      nextValue: 18900
    }
  },
  {
    id: "demo-audit-2",
    action: "COURSE_TEACHER_ASSIGNED",
    entityType: "USER",
    entityId: "demo-teacher-juan",
    entityLabel: "Juan Gomez",
    createdAt: new Date("2026-05-08T08:42:00.000Z"),
    actor: { name: "Admin Demo", email: "admin.demo@autismo.local" },
    metadata: {
      selectedCourseIds: ["demo-course-acompanamiento", "demo-course-conductual"]
    }
  },
  {
    id: "demo-audit-3",
    action: "PROMOTION_CREATED",
    entityType: "PROMOTION",
    entityId: "demo-promo-otono",
    entityLabel: "OTONO24",
    createdAt: new Date("2026-05-07T17:05:00.000Z"),
    actor: { name: "Admin Demo", email: "admin.demo@autismo.local" },
    metadata: {
      scope: "GLOBAL",
      amountInCents: 20
    }
  }
] as const;

export const demoAdminSupervisionRows = [
  {
    id: "demo-enrollment-1",
    studentName: "Ana Lopez",
    studentEmail: "ana.lopez@demo.local",
    courseTitle: "Estrategias de intervencion temprana",
    editionLabel: "Edicion Otono 2024",
    status: "ACTIVE",
    accessState: "active",
    accessUntil: new Date("2025-01-15T18:00:00.000Z"),
    completionRate: 68,
    completedModules: 5,
    totalModules: 8,
    lastCompletedAt: new Date("2026-05-07T19:10:00.000Z"),
    teachers: ["Maria Rodriguez", "Juan Gomez"]
  },
  {
    id: "demo-enrollment-2",
    studentName: "Pablo Martin",
    studentEmail: "pablo.martin@demo.local",
    courseTitle: "Comunicacion aumentativa y alternativa",
    editionLabel: "Edicion Continua",
    status: "ACTIVE",
    accessState: "scheduled",
    accessUntil: new Date("2025-07-30T18:00:00.000Z"),
    completionRate: 32,
    completedModules: 3,
    totalModules: 10,
    lastCompletedAt: new Date("2026-05-02T17:30:00.000Z"),
    teachers: ["Maria Rodriguez", "Laura Sanchez"]
  },
  {
    id: "demo-enrollment-3",
    studentName: "Lucia Perez",
    studentEmail: "lucia.perez@demo.local",
    courseTitle: "Ajustes razonables en el aula",
    editionLabel: "Edicion Primavera 2025",
    status: "EXPIRED",
    accessState: "expired",
    accessUntil: new Date("2025-06-20T18:00:00.000Z"),
    completionRate: 95,
    completedModules: 6,
    totalModules: 6,
    lastCompletedAt: new Date("2026-04-28T11:00:00.000Z"),
    teachers: ["Laura Sanchez"]
  }
] as const;
