# Staging Deploy Runbook

Fecha de corte: `2026-05-20`

## 1. Rama / commit recomendado para staging

- Rama recomendada: `main`
- `HEAD` actual visible en Git: `171cb6908bb7a8fb7e27413fa71aaa91390b830a`
- El estado aceptado actual no coincide con `HEAD` limpio: el worktree contiene cambios pendientes de hardening que forman parte del release aceptado.
- No desplegar `171cb69` aislado.
- Antes de desplegar staging, crear un snapshot inmutable del estado actual:

```bash
git status --short
git add prisma/schema.prisma prisma/migrations/20260520183000_production_hardening src/actions/account-security.ts src/actions/purchase.ts src/app/api/health/route.ts src/app/api/readiness/route.ts src/app/api/monitoring/client-errors/route.ts src/app/api/stripe/webhook/route.ts src/lib/payment-webhook-events.ts src/lib/purchase-runtime.ts src/lib/purchases.ts src/lib/runtime-readiness.ts src/lib/stripe.ts tests/integration/account-security-actions.test.ts tests/integration/client-errors-route.test.ts tests/integration/health-readiness-routes.test.ts tests/integration/payment-webhook-events.test.ts tests/integration/purchase-action.test.ts tests/integration/stripe-webhook-route.test.ts
git commit -m "release: freeze accepted staging hardening snapshot"
git rev-parse HEAD
```

- El commit devuelto por ese `git rev-parse HEAD` es el commit recomendado para staging.
- Si no se quiere commitear todavía en `main`, crear una rama de release desde `main`, commitear ahí el snapshot y desplegar ese commit.

## 2. Comandos previos

Ejecutar estos comandos antes de tocar staging:

```bash
git status --short
git rev-parse HEAD
npm ci
npx prisma generate
npx prisma migrate status
npm run test:unit
npm run test:integration
npm run build
```

Comandos operativos previos fuera del repo:

- Crear snapshot/backup de la base de datos de staging.
- Crear backup del storage de staging si `OBJECT_STORAGE_PROVIDER` no es `database`.
- Confirmar URL pública real de staging.
- Confirmar que el `DATABASE_URL` de staging apunta a una base aislada.

## 3. Variables obligatorias

### Obligatorias siempre en staging

| Variable | Valor recomendado |
| --- | --- |
| `DATABASE_URL` | URL real de MySQL de staging |
| `SESSION_SECRET` | secreto aleatorio largo exclusivo de staging |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.example.com` |
| `OBJECT_STORAGE_PROVIDER` | `vercel-blob` o `database`, definido explícitamente |
| `RATE_LIMIT_BACKEND` | `database` |
| `DEMO_AUTH_ENABLED` | `false` |
| `ALLOW_DEMO_AUTH` | `false` |
| `ALLOW_DEVELOPMENT_DEMO_PURCHASES` | `false` |
| `FORUM_DEMO_FALLBACK_ENABLED` | `false` |
| `LEGACY_CATALOG_FALLBACK_ENABLED` | `false` |
| `ALLOW_MEMORY_RATE_LIMIT_FALLBACK` | `false` |
| `ALLOW_DATABASE_STORAGE_FALLBACK` | `false` |
| `ALLOW_BOOTSTRAP_ADMIN_BY_EMAIL` | `false` |

### Obligatorias según feature o provider

| Variable | Cuándo es obligatoria |
| --- | --- |
| `STRIPE_SECRET_KEY` | si se va a probar checkout real en modo test |
| `STRIPE_WEBHOOK_SECRET` | siempre que exista `STRIPE_SECRET_KEY` |
| `BLOB_READ_WRITE_TOKEN` | si `OBJECT_STORAGE_PROVIDER=vercel-blob` |
| `OBJECT_STORAGE_FILESYSTEM_ROOT` | si `OBJECT_STORAGE_PROVIDER=filesystem` |
| `RESEND_API_KEY` | si se va a probar email real |
| `EMAIL_FROM` | si se va a probar email real |

### Recomendadas para staging

| Variable | Valor recomendado |
| --- | --- |
| `SESSION_TTL_DAYS` | `30` |
| `EMAIL_VERIFICATION_REQUIRED` | `false` salvo QA específico |
| `PASSWORD_RESET_TOKEN_TTL_MINUTES` | `60` |
| `EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | `48` |
| `LOG_LEVEL` | `info` |

## 4. Orden exacto de deploy

1. Congelar el estado aceptado en un commit o tag inmutable.
2. Verificar `git status --short` limpio después de congelar el snapshot.
3. Configurar todas las variables de entorno de staging en la plataforma.
4. Hacer backup de base de datos y storage de staging.
5. Ejecutar localmente `npm ci`, `npx prisma generate`, `npx prisma migrate status`, `npm run test:unit`, `npm run test:integration` y `npm run build`.
6. Si la base de staging ya existía antes de Prisma y no tiene historial aplicado, ejecutar una sola vez:

```bash
npx prisma migrate resolve --applied 0000_existing_baseline
```

7. Ejecutar migraciones sobre la base de staging:

```bash
npx prisma migrate deploy
```

8. Si staging va a usar `vercel-blob` o `filesystem` y todavía existen blobs legacy en `StoredAsset`, ejecutar:

```bash
npm run storage:migrate
```

9. Desplegar el commit congelado a staging en la plataforma.
10. Validar `health` y `readiness` antes de empezar QA funcional.
11. Configurar o verificar el endpoint real de Stripe contra `https://<staging>/api/stripe/webhook`.
12. Ejecutar la batería de pruebas post-deploy.
13. Documentar resultado de QA y decidir si staging queda promovible o requiere rollback.

## 5. Migraciones Prisma

Secuencia actual esperada en staging:

1. `0000_existing_baseline`
2. `20260514153038_hardening_observability_storage`
3. `20260519193000_sessions_and_rate_limits`
4. `20260520110000_payment_webhook_events`
5. `20260520183000_production_hardening`

Comandos:

```bash
npx prisma migrate status
npx prisma migrate deploy
```

Notas operativas:

- Si staging es un entorno nuevo, basta con `npx prisma migrate deploy`.
- Si staging ya existía sin historial Prisma, primero marcar `0000_existing_baseline` como aplicado y después desplegar migraciones.
- La migración `20260520183000_production_hardening` hace dos cosas sensibles:
  - añade columnas operativas a `payment_webhook_events`
  - elimina duplicados de `CourseEnrollment` antes de imponer la unicidad `userId + courseId`
- Por ese motivo el backup previo de base de datos es obligatorio.
- Si `migrate deploy` falla, no continuar con el deploy de aplicación ni con QA.

## 6. Configuración Stripe

Modo sin Stripe en staging:

- Dejar `STRIPE_SECRET_KEY` vacío.
- Dejar `STRIPE_WEBHOOK_SECRET` vacío.
- En este modo el readiness debe seguir devolviendo `ok: true` y `checks.stripe.enabled: false`.

Modo Stripe test real en staging:

- Definir `STRIPE_SECRET_KEY=sk_test_...`
- Definir `STRIPE_WEBHOOK_SECRET=whsec_...`
- Configurar en Stripe un endpoint público apuntando a:

```text
https://<staging>/api/stripe/webhook
```

- Escuchar al menos `checkout.session.completed`.
- No desplegar nunca con `STRIPE_SECRET_KEY` presente y `STRIPE_WEBHOOK_SECRET` ausente.
- Tras el deploy, probar:
  - creación de checkout
  - compra completa en sandbox
  - concesión de acceso por webhook
  - replay idempotente del evento

## 7. Configuración storage

Configuración recomendada:

- Definir siempre `OBJECT_STORAGE_PROVIDER` de forma explícita.
- En staging hosted, preferir `vercel-blob` si se quiere reproducir el comportamiento real de binarios privados.
- `database` es aceptable para staging si el objetivo es validar funcionalidad sin dependencia de blob externo.
- `filesystem` sólo es aceptable si el staging corre en una instancia única con disco persistente conocido.
- Mantener `ALLOW_DATABASE_STORAGE_FALLBACK=false`.

Si `OBJECT_STORAGE_PROVIDER=vercel-blob`:

- Definir `BLOB_READ_WRITE_TOKEN`.
- Verificar subida y descarga de:
  - recursos de curso
  - adjuntos de foro
  - adjuntos de entregas

Límites reales de subida para recursos y entregas del campus:

- Límite técnico de request en Next.js: `serverActions.bodySizeLimit=30mb` y `proxyClientMaxBodySize=30mb`.
- Límite funcional de la aplicación para archivos de recursos y entregas: `10 MB`.
- Comportamiento esperado:
  - hasta `10 MB`: la subida debe procesarse normalmente
  - más de `10 MB` y hasta `30mb`: la acción debe devolver error controlado de validación
  - por encima de `30mb`: Next.js/Vercel puede rechazar la request antes de entrar en la acción
- No subir el límite funcional sin revisar `src/lib/file-security.ts`, storage y QA de producción.

Si aún existen blobs binarios en `StoredAsset` y se quiere salir de MySQL:

```bash
npm run storage:migrate
```

## 8. Configuración rate limit

Valores de staging:

```text
RATE_LIMIT_BACKEND=database
ALLOW_MEMORY_RATE_LIMIT_FALLBACK=false
```

Motivo:

- El hardening actual usa rate limit persistente para login, registro, password reset, reenvío de verificación, admin mutations, `client-errors` y descargas protegidas.
- En staging multiinstancia no se debe aceptar backend `memory`.
- Si el backend persistente falla y el fallback a memoria está a `false`, el fallo debe verse como incidente, no ocultarse.

## 9. Pruebas post-deploy

Ejecutar al menos estas pruebas:

1. `GET /api/health` devuelve `200`.
2. `GET /api/readiness` devuelve `200`.
3. Login correcto como alumno, docente y admin.
4. Logout correcto y rutas protegidas redirigiendo sin sesión.
5. Registro o acceso bloqueado correctamente si el rate limit dispara.
6. Password reset y reenvío de verificación, si email está configurado.
7. Descarga de recurso de curso.
8. Subida y descarga de adjunto de foro.
9. Descarga de adjunto de entrega.
10. Acceso denegado a foro y descargas para usuarios sin permiso.
11. Acciones básicas de admin.
12. Si Stripe está activo:
    - iniciar checkout
    - completar pago de prueba
    - validar concesión de acceso
    - repetir evento y confirmar idempotencia

Verificaciones de datos recomendadas:

```sql
SELECT status, COUNT(*) FROM payment_webhook_events GROUP BY status;
SELECT userId, courseId, COUNT(*) AS total
FROM CourseEnrollment
GROUP BY userId, courseId
HAVING total > 1;
```

## 10. Cómo probar webhook real con Stripe CLI

### Opción A: prueba temporal con forwarding CLI

Verificada contra documentación oficial de Stripe CLI.

1. Autenticarse:

```bash
stripe login
```

2. Levantar listener reenviando sólo el evento necesario al staging:

```bash
stripe listen --events checkout.session.completed --forward-to https://<staging>/api/stripe/webhook
```

3. Copiar el `whsec_...` que imprime el comando.
4. Sustituir temporalmente `STRIPE_WEBHOOK_SECRET` de staging por ese `whsec_...`.
5. Reiniciar o redeployar staging para que cargue el nuevo secret.
6. Disparar el evento de prueba:

```bash
stripe trigger checkout.session.completed
```

7. Validar en staging:
   - respuesta `2xx` del webhook
   - fila nueva en `payment_webhook_events`
   - concesión de acceso o rechazo controlado según el caso probado
8. Restaurar el `STRIPE_WEBHOOK_SECRET` permanente del endpoint real de Stripe al terminar la prueba.

### Opción B: replay de un evento real ya emitido

Si ya existe un evento real en la cuenta de Stripe y el endpoint público está registrado:

```bash
stripe events resend <event_id> --webhook-endpoint=<endpoint_id>
```

Usar esta opción para comprobar idempotencia y replay sobre el endpoint real ya configurado.

## 11. Cómo validar health/readiness

Comandos:

```bash
curl -i https://<staging>/api/health
curl -i https://<staging>/api/readiness
```

Resultado esperado en health:

- HTTP `200`
- cuerpo con `ok: true`
- `status: "alive"`

Resultado esperado en readiness:

- HTTP `200`
- `status: "ready"`
- `checks.database.ok=true`
- `checks.storage.ok=true`
- `checks.session.ok=true`
- `checks.stripe.ok=true`

Casos válidos de readiness:

- Stripe desactivado por completo: readiness sigue siendo válido.
- Stripe configurado a medias: readiness debe fallar con `503`.
- `OBJECT_STORAGE_PROVIDER` sin definir explícitamente: readiness debe fallar con `503`.
- `OBJECT_STORAGE_PROVIDER=vercel-blob` sin `BLOB_READ_WRITE_TOKEN`: readiness debe fallar con `503`.

- ExcepciÃ³n local: fuera de entornos desplegados, si `NEXT_PUBLIC_SITE_URL` apunta a `localhost`, `127.0.0.1` o `::1`, puede aceptarse el fallback implÃ­cito a `database` y readiness seguir en `200` con detalle `implicit-local-database-fallback`.

## 12. Rollback

Rollback de aplicación:

1. Parar QA y checkout si se detecta incidente.
2. Volver al deployment estable anterior en la plataforma.
3. Revalidar `GET /api/health` y `GET /api/readiness`.

Rollback de base de datos:

- Si `npx prisma migrate deploy` no llegó a ejecutarse, basta con revertir aplicación.
- Si las migraciones sí se aplicaron y el problema está en datos o esquema, usar el snapshot de base de datos previo al despliegue.
- No intentar rollback manual improvisado sobre la migración `20260520183000_production_hardening`, porque elimina duplicados de `CourseEnrollment` antes de imponer unicidad.

Rollback de Stripe:

- Si el problema es de firma o routing, desactivar temporalmente QA de checkout.
- Restaurar el `STRIPE_WEBHOOK_SECRET` correcto.
- Reintentar sólo después de validar readiness y logs.

Rollback de storage:

- Restaurar credenciales o provider correcto.
- Si se ejecutó `npm run storage:migrate`, la reversión de datos depende del backup del provider o de la base previa.

## 13. Criterios para pasar a producción

Staging puede considerarse promotable sólo si:

1. El despliegue salió de un commit inmutable, no de un worktree sucio.
2. `npm run test:unit`, `npm run test:integration` y `npm run build` estuvieron en verde sobre ese snapshot.
3. `GET /api/health` y `GET /api/readiness` devolvieron `200` de forma estable.
4. Auth, sesiones, admin, foro, descargas y storage pasaron QA.
5. `RATE_LIMIT_BACKEND=database` quedó efectivo y sin fallback a memoria.
6. Si Stripe está activo:
   - checkout test completado
   - webhook procesado
   - replay validado
   - sin eventos atascados o duplicaciones en `payment_webhook_events`
7. No quedaron duplicados en `CourseEnrollment`.
8. Logs de servidor sin errores repetitivos de base de datos, storage, sesión o webhook.
9. El equipo validó que el plan de rollback y los backups previos siguen disponibles.

## Referencias

- [docs/STAGING_RC_CHECKLIST.md](./STAGING_RC_CHECKLIST.md)
- [prisma/migrations/README.md](../prisma/migrations/README.md)
- Stripe CLI oficial: https://docs.stripe.com/stripe-cli/use-cli
- Webhooks de Stripe: https://docs.stripe.com/webhooks
