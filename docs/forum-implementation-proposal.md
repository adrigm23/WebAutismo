# Propuesta de Implementación del Foro

## Objetivo

Aterrizar los diseños del foro de Stitch en la app actual de Next.js + Prisma, manteniendo:

- 1 foro por curso
- 1 edición activa del foro por curso
- ediciones anteriores archivadas y ocultas para alumnos
- moderación docente/admin
- hilos, respuestas, anuncios, archivo histórico y auditoría

El proyecto actual ya soporta:

- acceso por curso
- categorías de foro
- creación de hilos
- respuestas
- fijado de hilo
- cierre de hilo

Lo que falta es convertir ese foro simple en un sistema versionado y moderable.

## Estado actual del código

Base actual:

- Prisma: [prisma/schema.prisma](/C:/Users/adria/Documents/WepAplication-Autismo/prisma/schema.prisma:37)
- Lógica de foro: [src/lib/forum.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/forum.ts:59)
- Server actions: [src/actions/forum.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/actions/forum.ts:43)
- Comunidad/roles: [src/lib/course-community.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/course-community.ts:13)
- Entrada actual al foro desde el campus: [src/components/learning/course-learning-shell.tsx](/C:/Users/adria/Documents/WepAplication-Autismo/src/components/learning/course-learning-shell.tsx:382)

Limitación principal del modelo actual:

- `ForumCategory` depende directamente de `courseSlug`.
- No existe una entidad que represente una edición/instancia del foro.
- No hay soft delete, reportes, adjuntos, anuncios programados, auditoría ni notificaciones.

## Decisiones de diseño

### 1. Foro por edición

Cada curso tendrá una edición activa del foro.

Cuando se abra una nueva edición:

- se crea un nuevo `ForumSpace`
- las categorías cuelgan de ese `ForumSpace`
- la edición anterior pasa a `ARCHIVED`
- el alumno solo ve la edición `ACTIVE`
- docente/admin pueden ver `ACTIVE` y `ARCHIVED`

### 2. Moderación con soft delete

Para que Stitch y la funcionalidad real encajen:

- los mensajes eliminados no se borran físicamente al principio
- se marcan como eliminados
- en UI aparece un placeholder de moderación
- se registra quién hizo la acción y cuándo

### 3. Roles

El sistema actual solo tiene `STUDENT` y `TEACHER`.

Propuesta:

- mantener `STUDENT`
- mantener `TEACHER`
- añadir `ADMIN`

No hace falta añadir `MODERATOR` ahora mismo.

### 4. Anuncios

Los anuncios no deben ser otro modelo separado. Deben ser un tipo especial de hilo.

Ventajas:

- reutiliza detalle de hilo
- permite programación
- permite modo solo lectura
- simplifica la lista y los filtros

### 5. Respuesta resuelta

La respuesta marcada como útil/resuelta debe colgar de `ForumPost`, no de `ForumThread` solamente.

El hilo tendrá una referencia a la respuesta elegida.

## Propuesta de rutas

Árbol final recomendado:

```text
/mis-cursos/[slug]
/mis-cursos/[slug]/foro
/mis-cursos/[slug]/foro/[categorySlug]
/mis-cursos/[slug]/foro/[categorySlug]/[threadId]
/mis-cursos/[slug]/foro/nuevo
/mis-cursos/[slug]/foro/[categorySlug]/nuevo
/mis-cursos/[slug]/foro/[categorySlug]/[threadId]/editar
/mis-cursos/[slug]/foro/moderacion
/mis-cursos/[slug]/foro/historico
```

### Uso de cada ruta

- `/mis-cursos/[slug]/foro`
  - portada del foro del curso
  - categorías
  - acceso a moderación e histórico si el rol lo permite

- `/mis-cursos/[slug]/foro/[categorySlug]`
  - lista de hilos de una categoría
  - filtros y orden
  - botón de crear hilo

- `/mis-cursos/[slug]/foro/[categorySlug]/[threadId]`
  - detalle de hilo
  - respuestas
  - acciones de moderación

- `/mis-cursos/[slug]/foro/nuevo`
  - creación genérica de hilo con selector de categoría

- `/mis-cursos/[slug]/foro/[categorySlug]/nuevo`
  - creación ya contextualizada a la categoría

- `/mis-cursos/[slug]/foro/[categorySlug]/[threadId]/editar`
  - edición del mensaje principal del hilo
  - para alumno solo dentro de ventana de 15 minutos
  - docente/admin siempre

- `/mis-cursos/[slug]/foro/moderacion`
  - reportes
  - acciones rápidas
  - auditoría
  - hilos fijados/cerrados/resueltos
  - anuncios programados

- `/mis-cursos/[slug]/foro/historico`
  - edición activa
  - ediciones archivadas
  - restauración
  - eliminación definitiva

## Filtros recomendados en la UI

En `/foro/[categorySlug]`:

- `?status=open`
- `?status=closed`
- `?status=resolved`
- `?type=announcement`
- `?sort=recent`
- `?sort=created`
- `?sort=activity`

En moderación:

- `?reportStatus=open`
- `?reportStatus=reviewed`
- `?reportStatus=dismissed`

En histórico:

- `?scope=active`
- `?scope=archived`

## Propuesta de modelo Prisma

La idea no es pegar esto tal cual sin revisar, pero sí usarlo como base directa para la migración.

```prisma
enum CourseRole {
  STUDENT
  TEACHER
  ADMIN
}

enum ForumSpaceStatus {
  ACTIVE
  ARCHIVED
  DELETED
}

enum ForumThreadType {
  DISCUSSION
  ANNOUNCEMENT
}

enum ForumAttachmentKind {
  FILE
  IMAGE
  LINK
  VIDEO
}

enum ForumReportStatus {
  OPEN
  REVIEWED
  DISMISSED
  ACTION_TAKEN
}

enum ForumNotificationType {
  THREAD_REPLY
  MENTION
  TEACHER_ANNOUNCEMENT
  THREAD_REPORTED
  MODERATION_ACTION
}

enum ForumAuditAction {
  THREAD_CREATED
  THREAD_UPDATED
  THREAD_PINNED
  THREAD_UNPINNED
  THREAD_CLOSED
  THREAD_REOPENED
  THREAD_DELETED
  THREAD_RESTORED
  POST_CREATED
  POST_UPDATED
  POST_DELETED
  POST_RESTORED
  POST_MARKED_RESOLVED
  POST_UNMARKED_RESOLVED
  REPORT_CREATED
  REPORT_REVIEWED
  REPORT_DISMISSED
  SPACE_ARCHIVED
  SPACE_RESTORED
  SPACE_DELETED
}

model ForumSpace {
  id             String            @id @default(cuid())
  courseSlug      String
  editionLabel    String
  editionNumber   Int
  status          ForumSpaceStatus @default(ACTIVE)
  startsAt        DateTime?
  endsAt          DateTime?
  archivedAt      DateTime?
  archivedById    String?
  deletedAt       DateTime?
  deletedById     String?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  categories      ForumCategory[]

  @@index([courseSlug, status])
  @@unique([courseSlug, editionNumber])
}

model ForumCategory {
  id            String        @id @default(cuid())
  forumSpaceId   String
  slug          String
  title         String
  description   String
  sortOrder     Int           @default(0)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  forumSpace     ForumSpace    @relation(fields: [forumSpaceId], references: [id], onDelete: Cascade)
  threads       ForumThread[]

  @@unique([forumSpaceId, slug])
  @@index([forumSpaceId, sortOrder])
}

model ForumThread {
  id               String           @id @default(cuid())
  categoryId        String
  authorId          String
  authorRole        CourseRole
  type              ForumThreadType @default(DISCUSSION)
  title             String
  body              String
  isPinned          Boolean          @default(false)
  isClosed          Boolean          @default(false)
  isResolved        Boolean          @default(false)
  resolvedPostId    String?
  isReadOnly        Boolean          @default(false)
  scheduledFor      DateTime?
  publishedAt       DateTime?
  lastActivityAt    DateTime         @default(now())
  editedAt          DateTime?
  deletedAt         DateTime?
  deletedById       String?
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  author            User             @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category          ForumCategory    @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  posts             ForumPost[]
  attachments       ForumAttachment[]
  reports           ForumReport[]

  @@index([categoryId, isPinned, lastActivityAt])
  @@index([categoryId, type, deletedAt])
}

model ForumPost {
  id               String          @id @default(cuid())
  threadId          String
  authorId          String
  authorRole        CourseRole
  body              String
  editedAt          DateTime?
  deletedAt         DateTime?
  deletedById       String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  author            User           @relation(fields: [authorId], references: [id], onDelete: Cascade)
  thread            ForumThread    @relation(fields: [threadId], references: [id], onDelete: Cascade)
  attachments       ForumAttachment[]
  reports           ForumReport[]

  @@index([threadId, createdAt])
  @@index([threadId, deletedAt])
}

model ForumAttachment {
  id             String             @id @default(cuid())
  threadId        String?
  postId          String?
  kind           ForumAttachmentKind
  label          String
  url            String
  mimeType       String?
  sizeInBytes    Int?
  storageKey     String?
  createdById    String
  createdAt      DateTime           @default(now())
  thread         ForumThread?       @relation(fields: [threadId], references: [id], onDelete: Cascade)
  post           ForumPost?         @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([threadId])
  @@index([postId])
}

model ForumReport {
  id              String            @id @default(cuid())
  threadId         String?
  postId           String?
  reportedById     String
  reason           String
  notes            String?
  status           ForumReportStatus @default(OPEN)
  resolvedAt       DateTime?
  resolvedById     String?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  thread           ForumThread?     @relation(fields: [threadId], references: [id], onDelete: Cascade)
  post             ForumPost?       @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([status, createdAt])
  @@index([threadId])
  @@index([postId])
}

model ForumNotification {
  id              String               @id @default(cuid())
  userId           String
  courseSlug       String
  type            ForumNotificationType
  title           String
  body            String
  linkPath        String
  readAt          DateTime?
  createdAt       DateTime             @default(now())
  user            User                 @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, readAt, createdAt])
}

model ForumAuditLog {
  id              String           @id @default(cuid())
  courseSlug       String
  forumSpaceId     String?
  threadId         String?
  postId           String?
  actorId          String
  actorRole        CourseRole
  action          ForumAuditAction
  metadataJson     String?
  createdAt        DateTime        @default(now())

  @@index([courseSlug, createdAt])
  @@index([forumSpaceId, createdAt])
  @@index([threadId, createdAt])
}
```

## Relaciones con el modelo actual

### Tablas que deben mantenerse

- `User`
- `Purchase`
- `CourseMembership`

### Tablas actuales a evolucionar

- `ForumCategory`
- `ForumThread`
- `ForumPost`

### Tablas nuevas

- `ForumSpace`
- `ForumAttachment`
- `ForumReport`
- `ForumNotification`
- `ForumAuditLog`

## Categorías por defecto

Sustituir las categorías actuales de [defaultCourseCategories](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/course-community.ts:13) por estas:

```ts
[
  {
    slug: "anuncios",
    title: "Anuncios",
    description: "Comunicaciones del docente y avisos importantes del curso.",
    sortOrder: 1
  },
  {
    slug: "dudas",
    title: "Dudas",
    description: "Preguntas del alumnado y resolución de incidencias del contenido.",
    sortOrder: 2
  },
  {
    slug: "tareas",
    title: "Tareas",
    description: "Indicaciones, seguimiento y aclaraciones sobre ejercicios y entregas.",
    sortOrder: 3
  },
  {
    slug: "general",
    title: "General",
    description: "Debate abierto sobre el curso y conversación general del grupo.",
    sortOrder: 4
  },
  {
    slug: "material-adicional",
    title: "Material adicional",
    description: "Recursos extra, lecturas, enlaces y materiales complementarios.",
    sortOrder: 5
  }
]
```

## Permisos por rol

### Student

- ver solo foro activo
- crear hilo
- responder
- editar su propio contenido durante 15 minutos
- subir adjuntos
- reportar contenido
- recibir notificaciones

### Teacher

- todo lo de `Student`
- fijar/desfijar hilo
- cerrar/reabrir hilo
- marcar respuesta resuelta
- crear anuncios
- programar anuncios
- borrar con moderación
- revisar reportes
- consultar auditoría
- archivar edición
- restaurar edición archivada

### Admin

- todo lo de `Teacher`
- eliminar definitivamente edición archivada
- recuperar contenido moderado
- acceso completo a histórico y auditoría

## Server actions necesarias

En [src/actions/forum.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/actions/forum.ts:43) hay que pasar de 4 acciones a un set bastante más completo.

Acciones nuevas:

- `createForumAnnouncementAction`
- `scheduleForumAnnouncementAction`
- `editForumThreadAction`
- `editForumPostAction`
- `deleteForumThreadAction`
- `deleteForumPostAction`
- `restoreForumThreadAction`
- `restoreForumPostAction`
- `markResolvedPostAction`
- `unmarkResolvedPostAction`
- `reportForumThreadAction`
- `reportForumPostAction`
- `archiveForumSpaceAction`
- `restoreForumSpaceAction`
- `deleteForumSpacePermanentlyAction`
- `markForumNotificationReadAction`

Acciones actuales que se mantienen:

- `createForumThreadAction`
- `createForumReplyAction`
- `toggleThreadPinnedAction`
- `toggleThreadClosedAction`

## Funciones de dominio necesarias

En [src/lib/forum.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/forum.ts:59) conviene separar lectura y escritura en más funciones pequeñas.

### Lectura

- `getActiveForumSpace(courseSlug)`
- `getArchivedForumSpaces(courseSlug)`
- `getForumCategoriesBySpace(spaceId)`
- `getForumCategoryBySlug(courseSlug, categorySlug)`
- `getForumThreads(input)`
- `getForumThreadDetail(input)`
- `getForumModerationDashboard(courseSlug)`
- `getForumHistoryDashboard(courseSlug)`
- `getForumNotifications(userId)`

### Escritura

- `createForumSpace`
- `archiveForumSpace`
- `restoreForumSpace`
- `deleteForumSpace`
- `createForumThread`
- `updateForumThread`
- `softDeleteForumThread`
- `createForumReply`
- `updateForumPost`
- `softDeleteForumPost`
- `markResolvedPost`
- `createForumReport`
- `dismissForumReport`
- `createForumNotification`
- `createForumAuditLog`

## Pantallas y archivos a crear o modificar

### Rutas nuevas

- `src/app/mis-cursos/[slug]/foro/page.tsx`
- `src/app/mis-cursos/[slug]/foro/nuevo/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/nuevo/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/[threadId]/editar/page.tsx`
- `src/app/mis-cursos/[slug]/foro/moderacion/page.tsx`
- `src/app/mis-cursos/[slug]/foro/historico/page.tsx`

### Archivos a ampliar

- `prisma/schema.prisma`
- `src/lib/course-roles.ts`
- `src/lib/course-community.ts`
- `src/lib/forum.ts`
- `src/actions/forum.ts`
- `src/components/learning/course-learning-shell.tsx`
- `src/components/ui/badge.tsx`

### Componentes nuevos

- `src/components/forum/forum-category-grid.tsx`
- `src/components/forum/forum-thread-list.tsx`
- `src/components/forum/forum-thread-card.tsx`
- `src/components/forum/forum-thread-toolbar.tsx`
- `src/components/forum/forum-thread-detail.tsx`
- `src/components/forum/forum-post-card.tsx`
- `src/components/forum/forum-attachment-list.tsx`
- `src/components/forum/forum-report-button.tsx`
- `src/components/forum/forum-moderation-panel.tsx`
- `src/components/forum/forum-history-panel.tsx`
- `src/components/forum/forum-announcement-form.tsx`
- `src/components/forum/forum-empty-state.tsx`

## Secuencia de implementación recomendada

### Fase 1. Modelo y migración

- añadir `ADMIN` a `CourseRole`
- crear `ForumSpace`
- mover `ForumCategory` a `forumSpaceId`
- ampliar `ForumThread` y `ForumPost`
- crear adjuntos, reportes, auditoría y notificaciones

### Fase 2. Lectura del foro por edición activa

- introducir `getActiveForumSpace`
- hacer que categorías, hilos y detalle lean siempre de la edición activa
- preparar lectura de histórico para docente/admin

### Fase 3. UI base alineada con Stitch

- nueva portada del foro
- lista de hilos con filtros
- detalle de hilo con estados
- badges nuevos

### Fase 4. Moderación

- reportes
- soft delete
- respuesta resuelta
- anuncios programados
- auditoría

### Fase 5. Histórico

- archivo por edición
- restauración
- eliminación definitiva

### Fase 6. Notificaciones

- primero in-app
- después email de anuncios importantes reutilizando [src/lib/email.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/email.ts:27)

## Riesgos y decisiones abiertas

### 1. Upload real de adjuntos

El diseño ya los contempla, pero el proyecto aún no tiene infraestructura de almacenamiento.

Opciones:

- fase inicial con solo enlaces
- fase siguiente con almacenamiento real

### 2. Admin real

Ahora el docente se resuelve por `TEACHER_EMAILS` en [course-community.ts](/C:/Users/adria/Documents/WepAplication-Autismo/src/lib/course-community.ts:37).

Si se quiere `ADMIN` real, habrá que:

- ampliar membresías
- definir cómo se asigna ese rol
- revisar guards y paneles

### 3. Eliminación definitiva

La propuesta usa soft delete para casi todo al principio.

La eliminación definitiva debería limitarse a:

- ediciones archivadas
- contenido ya moderado
- acción solo disponible para admin

## Propuesta mínima viable

Si hay que reducir alcance para llegar antes a producción, el MVP razonable sería:

- `ForumSpace`
- categorías nuevas
- filtros en lista
- `isResolved`
- soft delete de hilos/posts
- panel de moderación básico
- histórico por edición sin restauración avanzada

Se puede dejar para una segunda iteración:

- adjuntos binarios reales
- menciones
- email de anuncios
- auditoría muy detallada
- notificaciones avanzadas

## Siguiente paso recomendado

El siguiente paso de implementación debería ser:

1. actualizar `prisma/schema.prisma`
2. generar la migración
3. refactorizar `src/lib/course-community.ts`
4. refactorizar `src/lib/forum.ts`
5. crear la nueva portada `/mis-cursos/[slug]/foro`

Con eso ya quedaría la base correcta para empezar a convertir Stitch en interfaz real.
