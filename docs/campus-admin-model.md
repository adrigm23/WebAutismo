# Campus admin model

## Objetivo

La aplicacion ya no toma `src/data/courses.ts` como fuente principal del negocio. Ese archivo queda como bootstrap inicial del catalogo si la base de datos todavia no tiene cursos cargados.

## Modelo persistido

- `User`: rol global (`STUDENT`, `TEACHER`, `ADMIN`), estado activo/inactivo y preferencias de notificacion.
- `Course`: curso persistido con metadatos SEO, precio y blobs JSON para audiencia, objetivos, metodologia y FAQ.
- `CourseModule`: modulos ordenados por curso.
- `CourseEdition`: ediciones con fechas, estado y ventana posterior (`graceAccessDays` / `accessUntil`).
- `CourseTeacherAssignment`: asignacion many-to-many de docentes por curso.
- `CourseEnrollment`: matriculas/accesos con baja logica.
- `Purchase`: pedido con subtotal, descuento, impuestos y total final.
- `Promotion` y `PromotionRedemption`: cupones y uso efectivo.
- `NotificationPreference` y `UserNotification`: preferencias por usuario y notificaciones web generales.
- `AuditLog`: auditoria transversal. La auditoria del foro (`ForumAuditLog`) se mantiene separada.

## Bootstrap del primer admin

La app no depende de `ADMIN_EMAILS` ni `TEACHER_EMAILS` para operar. Solo se mantiene un bootstrap opcional mediante `BOOTSTRAP_ADMIN_EMAILS`: si no existe ningun admin persistido y un usuario se registra o accede con uno de esos correos, su cuenta se promociona a administrador.

## Stripe y promociones

- El checkout genera importe dinamico en servidor con subtotal, descuento, IVA y total final.
- Ya no se depende de `STRIPE_PRICE_*` fijos por curso.
- El webhook de Stripe confirma la compra y activa la matricula.
- Si Stripe no esta configurado, la app conserva un flujo demo local.

## Nota de entorno

El esquema Prisma esta orientado a MySQL. En este workspace la build puede ejecutarse sin una URL MySQL valida gracias al fallback del catalogo publico, pero las consultas reales de administracion, auth, compras y campus requieren una `DATABASE_URL` MySQL operativa.
