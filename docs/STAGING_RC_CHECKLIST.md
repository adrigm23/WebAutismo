# Staging RC Checklist

## 1. Estado actual del release

### Commits incluidos

1. `24a65c9` - `storage: align database provider and fix downloads`
2. `971f55a` - `hardening: add sessions rate limits and stripe webhook idempotency`
3. `d34b695` - `chore: document production runtime environment flags`
4. `171cb69` - `fix: tighten purchase and admin session side effects`

### Estado del branch

- Worktree limpio.
- Build validado localmente.
- Tests focalizados en verde.
- Migraciones presentes y aplicadas en entorno local auditado.
- Storage y descargas alineados con el runtime actual.
- Webhook de Stripe validado a nivel de código y tests.
- Logout y sesiones revisados.

### Qué está listo para staging

- Runtime base de Next/Prisma.
- Auth y sesiones con backing en base de datos.
- Rate limit persistente por base de datos.
- Storage configurable por provider con fallback demo capado en hosted/prod.
- Descargas protegidas de recursos, entregas y adjuntos.
- Proxy/middleware como control de acceso inicial.
- Foro, campus y admin en un estado razonablemente sólido para QA funcional.

### Qué NO está listo para producción

- No debe salir a producción mientras exista la posibilidad de `STRIPE_SECRET_KEY` sin `STRIPE_WEBHOOK_SECRET`.
- No debe salir a producción mientras el recovery de eventos Stripe atascados en `PROCESSING` siga incompleto.
- No debe salir a producción mientras no se cierre la idempotencia cruzada de `purchase/enrollment`.
- No hay health/readiness formal ni playbook operativo cerrado de observabilidad y backups dentro del repo.

## 2. Variables de entorno obligatorias para staging

Notas:

- Los ejemplos son seguros como plantilla, no como credenciales reales.
- En staging se recomienda definir explícitamente también los valores que el código ya defaulta, para evitar ambigüedad operativa.
- Si una variable figura como opcional pero la feature asociada se va a probar, pasa a ser obligatoria en ese entorno.

### App / base

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.example.com` | Sí | URLs absolutas incorrectas y fallo en producción si falta | URL pública real de staging, sin slash final |
| `LOG_LEVEL` | `info` | No | Menor control de verbosidad de logs | `info` |

### Database

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | `mysql://user:pass@host:3306/db_name` | Sí | La app no arranca o rompe runtime DB-dependiente | URL real de base de datos de staging aislada |

### Auth / session

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `SESSION_SECRET` | `replace-with-32-plus-random-chars` | Sí | Sesiones inválidas o imposibles de verificar | Secreto aleatorio largo, exclusivo de staging |
| `SESSION_TTL_DAYS` | `30` | No | TTL implícito por defecto; posible divergencia operativa | `30` |
| `EMAIL_VERIFICATION_REQUIRED` | `false` o `true` | No | Si se activa sin email operativo, rompe onboarding | `false` salvo que se quiera validar email end-to-end |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | `60` | No | TTL por defecto quizá no alineado con política | `60` |
| `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | `48` | No | TTL por defecto quizá no alineado con política | `48` |

### Stripe

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_xxx` | Sí si se va a probar checkout real de staging | Checkout deshabilitado; si existe sin webhook secret aparece riesgo P0 | `sk_test_...` de cuenta de staging/test |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxx` | Sí si existe `STRIPE_SECRET_KEY` | Cobro posible sin concesión de acceso si falta | `whsec_...` del endpoint real de staging |

### Storage

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `OBJECT_STORAGE_PROVIDER` | `vercel-blob` | Sí | El runtime puede caer en default `database` y desalinear expectativas | `vercel-blob` o `database`, definido explícitamente |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_xxx` | Sí si `OBJECT_STORAGE_PROVIDER=vercel-blob` | Fallan uploads/downloads del provider blob | Token real de staging |
| `OBJECT_STORAGE_FILESYSTEM_ROOT` | `storage/objects` | No | Solo afecta si se usa `filesystem` | Solo definir si staging usa `filesystem` |

### Rate limit

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `RATE_LIMIT_BACKEND` | `database` | Sí | Default implícito correcto, pero sin definición explícita hay ambigüedad operativa | `database` |

### Demo / fallback flags

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `DEMO_AUTH_ENABLED` | `false` | Sí | Si se activase junto con allowlist, abre auth demo en local; conviene fijarlo | `false` |
| `ALLOW_DEMO_AUTH` | `false` | Sí | Misma familia de riesgo demo auth | `false` |
| `ALLOW_DEVELOPMENT_DEMO_PURCHASES` | `false` | Sí | Riesgo de flujo demo de compra en entornos no previstos | `false` |
| `FORUM_DEMO_FALLBACK_ENABLED` | `false` | Sí | Riesgo de fallback demo de foro | `false` |
| `LEGACY_CATALOG_FALLBACK_ENABLED` | `false` | Sí | Riesgo de fallback legacy de catálogo | `false` |
| `ALLOW_MEMORY_RATE_LIMIT_FALLBACK` | `false` | Sí | Si se activa, el rate limit puede degradar a memoria sin garantía cross-instance | `false` |
| `ALLOW_DATABASE_STORAGE_FALLBACK` | `false` | Sí | Si se activa, el storage puede degradar a DB sin visibilidad suficiente | `false` |
| `ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL` | `false` | Sí | Puede elevar privilegios al primer admin por email allowlist | `false` |
| `DEMO_AUTH_PASSWORD` | vacío | No | Solo aplica a auth demo | No definir |
| `BOOTSTRAP_ADMIN_EMAILS` | vacío o lista controlada | No | Si se combina con bootstrap activo, riesgo de admin bootstrap | No definir tras bootstrap inicial |
| `LOCAL_BOOTSTRAP_PASSWORD` | vacío | No | Solo utilidad local/operativa puntual | No definir |

### Logging

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `LOG_LEVEL` | `info` | No | Menor control de visibilidad | `info` |

Nota:

- El repo expone logging estructurado, pero no define por sí mismo un drain/retention externo. Ese cierre operativo debe vivir en la plataforma de staging.

### Email

| Variable | Ejemplo seguro | Obligatoria | Riesgo si falta | Recomendado en staging |
| --- | --- | --- | --- | --- |
| `RESEND_API_KEY` | `re_xxx` | No, salvo que se pruebe email real | Reset/verificación por correo no funcionarán | Definir si se va a probar onboarding/reset/verificación |
| `EMAIL_FROM` | `Academia Autismo <no-reply@staging.example.com>` | No, salvo que se pruebe email real | Envío de correo inválido o inconsistente | Definir junto a `RESEND_API_KEY` |

## 3. Flags que deben estar en `false` en staging

Estos flags deben quedar explícitamente en `false`:

- `DEMO_AUTH_ENABLED=false`
- `ALLOW_DEMO_AUTH=false`
- `ALLOW_DEVELOPMENT_DEMO_PURCHASES=false`
- `FORUM_DEMO_FALLBACK_ENABLED=false`
- `LEGACY_CATALOG_FALLBACK_ENABLED=false`
- `ALLOW_MEMORY_RATE_LIMIT_FALLBACK=false`
- `ALLOW_DATABASE_STORAGE_FALLBACK=false`
- `ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL=false`

## 4. Checklist antes de deploy

- Confirmar snapshot/backup de la base de datos de staging.
- Confirmar estrategia de backup del provider de storage si no es `database`.
- Confirmar que `DATABASE_URL` apunta a staging aislado.
- Ejecutar `npx prisma generate`.
- Ejecutar `npx prisma migrate deploy`.
- Si el entorno arrastra esquema previo sin historial Prisma, revisar `prisma/migrations/README.md` antes de marcar baseline.
- Ejecutar `npm run build`.
- Ejecutar la batería de tests acordada para RC.
- Confirmar que todas las variables de entorno anteriores están configuradas.
- Confirmar `NEXT_PUBLIC_SITE_URL` real de staging.
- Confirmar `OBJECT_STORAGE_PROVIDER` definido explícitamente.
- Confirmar `RATE_LIMIT_BACKEND=database`.
- Confirmar `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` juntos si se va a probar pago real test.
- Configurar endpoint de webhook de Stripe contra staging antes del QA de checkout.
- Confirmar `ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL=false`.
- Confirmar que no quedan credenciales locales o temporales en el panel del entorno.

## 5. Checklist después de deploy

### Autenticación y sesiones

- Login de alumno correcto.
- Login de docente correcto.
- Login de admin correcto.
- Logout correcto.
- Logout de otras sesiones o revocación de sesiones, si la acción está expuesta en UI/flujo operativo.
- Acceso a rutas protegidas redirige correctamente sin sesión.
- Cookie de sesión presente con `HttpOnly`, `Secure` en HTTPS y comportamiento consistente.

### Checkout y Stripe

- Compra bloqueada de forma explícita si Stripe no está configurado.
- Compra real en modo test de Stripe completa correctamente.
- El webhook `checkout.session.completed` procesa el pago y concede acceso.
- Replay manual del webhook vía Stripe CLI no duplica efectos.
- Verificar que no aparece estado huérfano en `payment_webhook_events`.

### Storage y descargas

- Descarga de recurso de curso correcta.
- Subida y descarga de adjunto de foro correcta.
- Descarga de entrega/adjunto de submission correcta.
- Validar que el provider esperado es el que realmente está sirviendo los binarios.
- Confirmar ausencia de dependencia accidental de rutas legacy durante la prueba.

### Foro y permisos

- Crear hilo como alumno.
- Responder hilo como alumno.
- Moderar hilo como docente/admin.
- Validar que un usuario sin acceso al curso no entra al foro ni descarga adjuntos.

### Admin

- Gestión básica de usuarios desde admin.
- Gestión básica de cursos desde admin.
- Confirmar que un no-admin no puede ejecutar acciones admin.

### Runtime y observabilidad

- Confirmar que no se activan fallbacks demo.
- Confirmar ausencia de errores relevantes en consola del navegador.
- Confirmar ausencia de errores relevantes en logs del servidor.
- Confirmar que los logs esperados aparecen para login, checkout, webhook y descargas.

## 6. Riesgos P0 / P1 / P2

### P0

- Stripe puede entrar en `live` con `STRIPE_SECRET_KEY` aunque falte `STRIPE_WEBHOOK_SECRET`.

### P1

- Un evento Stripe puede quedarse atascado en `PROCESSING` y no recuperarse automáticamente por replay.
- Sigue existiendo riesgo de duplicación de `purchase/enrollment` por falta de idempotencia cruzada.

### P2

- `ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL` debe permanecer desactivado fuera del bootstrap inicial.
- Persisten fallbacks legacy de storage en lectura.
- Falta rate limit específico para reset de contraseña y reenvío de verificación.
- El endpoint público de `client-errors` no tiene rate limit.
- Health/readiness formal sigue pendiente.

## 7. Decisión de release

### Permitido para staging

Sí, con condiciones:

- Entorno real de staging aislado.
- Variables configuradas explícitamente.
- Stripe configurado de forma completa o deshabilitado de forma consciente.
- Backup previo realizado.
- QA post-deploy ejecutado con especial foco en checkout, webhook y descargas.

### Permitido para producción

No todavía.

### Condiciones para pasar a producción

- Exigir configuración completa de Stripe en runtime live.
- Resolver recovery de webhook atascado en `PROCESSING`.
- Cerrar la idempotencia cruzada de `purchase/enrollment`.
- Cerrar health/readiness operativo.
- Tener observabilidad y backups validados en el entorno destino.
- Repetir QA de negocio sobre staging estable con resultados documentados.

## 8. Rollback

### Cómo revertir deploy

- Revertir al deployment anterior estable desde la plataforma de despliegue.
- Mantener el snapshot de base de datos del pre-release hasta cerrar QA y smoke checks del RC.

### Qué hacer si migración falla

- Detener promoción del release.
- No seguir con QA funcional.
- Revisar el estado exacto de `prisma migrate status`.
- Si la migración quedó parcial, tratarlo como incidente de base de datos y decidir sobre restore del snapshot previo en vez de improvisar cambios manuales.

### Qué hacer si webhook falla

- Deshabilitar pruebas de cobro reales hasta corregir configuración.
- Verificar inmediatamente presencia y validez de `STRIPE_WEBHOOK_SECRET`.
- Reenviar eventos con Stripe CLI solo después de confirmar la causa.
- Revisar tabla `payment_webhook_events` y compras pendientes antes de reintentar.

### Qué hacer si storage falla

- Confirmar provider efectivo y credenciales.
- Verificar acceso al bucket o backend de storage.
- Si staging depende de `vercel-blob`, no asumir fallback a DB como estrategia aceptable de release.
- Pausar QA de uploads/downloads hasta restaurar el provider esperado.

### Qué hacer si auth falla

- Verificar `SESSION_SECRET`, dominio/URL real y HTTPS.
- Confirmar conectividad a base de datos para `UserSession`.
- Validar login/logout con usuario limpio y revisar logs de sesión antes de seguir con más pruebas.

## 9. Próximos fixes recomendados

1. Exigir `STRIPE_WEBHOOK_SECRET` si `STRIPE_SECRET_KEY` existe en live.
2. Añadir recovery de webhook en estado `PROCESSING`.
3. Cerrar idempotencia cruzada de `purchase/enrollment`.
4. Añadir rate limit a reset/verificación.
5. Añadir rate limit a `client-errors`.
6. Añadir health/readiness.
7. Limpiar legacy storage.

## 10. Resumen ejecutivo

- El release candidate es apto para un staging real con QA funcional y operativo.
- No es apto todavía para producción por un bloqueo P0 de Stripe y dos riesgos P1 en pagos/idempotencia.
- La prioridad del siguiente ciclo no es UI ni frontend: es endurecimiento final de pagos, operativa y observabilidad.
