# UI Inventory

## Objetivo
Inventario del estado actual de primitives, shells y componentes repetidos para decidir qué se mantiene en v1, qué se consolida y qué queda como deuda de Fase C.

## Resumen ejecutivo
- Hay primitives reutilizables suficientes para estabilizar el sistema.
- El problema principal no es falta de componentes, sino proliferación de variantes locales.
- Las áreas con más divergencia visual son: ficha de curso pública, foro, panel docente y admin.
- El mayor riesgo actual es seguir construyendo nuevos bloques one-off antes de consolidar patrones.

## Primitives UI
### `Button` / `ButtonLink`
Archivo:
- `src/components/ui/button.tsx`

Estado actual:
- Bueno como base.
- Ya soportaba 4 variantes útiles.

Se mantiene:
- Componente único para botón y link botón.
- Base de transición, hover y focus.

Se consolida:
- Nombres canónicos: `primary`, `neutral`, `subtle`, `highlight`.
- Compatibilidad legacy: `secondary`, `ghost`, `accent`.

Se debe evitar:
- Crear botones inline estilados fuera del primitive.
- Usar botones para navegación estructural que debería ser link/tab/nav.

Refactor futuro:
- tamaños `sm/md/lg`
- icon-only button
- destructive variant
- loading icon opcional

### `Card`
Archivo:
- `src/components/ui/card.tsx`

Estado actual:
- Útil, pero convivía con demasiadas cards custom.

Se mantiene:
- Card genérica como contenedor principal.

Se consolida:
- Se apoya ahora en `ui-card-base`.

Se debe evitar:
- repetir borde + radio + sombra en cada pantalla sin pasar por `Card` o wrapper equivalente.

Refactor futuro:
- variantes `default`, `interactive`, `soft`, `state`

### `SurfaceCard`
Archivo:
- `src/components/ui/surface-card.tsx`

Estado actual:
- Wrapper útil para secciones editoriales o panels con cabecera.

Se mantiene:
- como card semiestructurada para páginas interiores.

Se consolida:
- base compartida con `Card`.

Se debe evitar:
- crear nuevos wrappers de card con el mismo propósito.

Refactor futuro:
- aceptar variant semántica
- aceptar footer/action slot

### `Input`
Archivo:
- `src/components/ui/input.tsx`

Estado actual:
- correcto, pero no totalmente alineado con `Textarea`.

Se mantiene:
- primitive único.

Se consolida:
- clase base común `ui-control-base`
- altura de control semántica
- radio estándar

Se debe evitar:
- inputs con clases ad hoc en auth, admin o foro para patrones estándar.

Refactor futuro:
- helper text
- error state semántico
- prefix/suffix/icon support

### `Textarea`
Archivo:
- `src/components/ui/textarea.tsx`

Estado actual:
- consistente, pero separado del lenguaje del input.

Se mantiene:
- primitive único.

Se consolida:
- base compartida de borde, focus y radio.

Se debe evitar:
- textareas con estilos locales salvo composición justificada.

Refactor futuro:
- contador opcional
- error/success API
- autosize en casos necesarios

### `Badge`
Archivo:
- `src/components/ui/badge.tsx`

Estado actual:
- funcional pero con naming orientado al dominio actual, no al sistema.

Se mantiene:
- componente único.

Se consolida:
- tonos canónicos: `neutral`, `outline`, `info`, `success`, `warning`, `danger`, `brand`
- aliases legacy para no tocar pantallas.

Se debe evitar:
- usar badges como decoración.
- introducir nuevos tonos por página.

Refactor futuro:
- icon badges
- tamaños
- semantic pill vs square badge

### `SubmitButton` / `ConfirmSubmitButton`
Archivos:
- `src/components/ui/submit-button.tsx`
- `src/components/ui/confirm-submit-button.tsx`

Estado actual:
- buenos wrappers tácticos.

Se mantiene:
- integración con `useFormStatus`.

Se consolida:
- tipado alineado con `ButtonVariant`.

Se debe evitar:
- más wrappers específicos si se puede resolver con props.

Refactor futuro:
- confirm modal no bloqueante en lugar de `window.confirm`

## Tabs
### Estado actual
- No existe un primitive global de tabs.
- Hay implementaciones locales:
  - `WorkspaceTabButton` en `src/components/learning/course-learning-shell/primitives.tsx`
  - tabs/filtros locales en foro y otras páginas

Se mantiene:
- `WorkspaceTabButton` como referencia visual útil.

Se consolida:
- patrón visual de tabs pills y tabs segmentadas.

Se debe evitar:
- reimplementar tabs con clases nuevas en cada pantalla.

Refactor futuro:
- `src/components/ui/tabs.tsx`

## Headers y navegación
### `SiteHeader`
Archivo:
- `src/components/site-header.tsx`

Estado actual:
- correcto para público.
- falta estado activo en desktop y refinamiento móvil.

Se mantiene:
- separación clara entre público y privado.

Se consolida:
- como base de navegación pública.

Se debe evitar:
- añadir más CTAs sin jerarquía.

### Header alumno
Archivo:
- `src/components/account/student-account-dashboard.tsx`

Estado actual:
- útil, pero específico de `mi-cuenta`.

Problema:
- no es el header autenticado global del alumno; es un header de página.

### Header docente
Archivo:
- `src/components/account/teacher-account-dashboard.tsx`

Estado actual:
- más sólido que el alumno.

Problema:
- convive con lateral docente y no define todavía una IA compartida para todo el rol.

### Header campus
Archivo:
- `src/components/learning/course-learning-shell/course-learning-header.tsx`

Estado actual:
- buen punto de partida para navegación dentro del curso.

Problema:
- mezcla navegación global del curso con tabs de workspace.

### `AdminShell`
Archivo:
- `src/components/admin/admin-shell.tsx`

Estado actual:
- el shell más estructurado del proyecto.

Se mantiene:
- sidebar + topbar + búsqueda como patrón admin.

Se consolida:
- como referencia para áreas operativas densas.

Se debe evitar:
- trasladar este patrón tal cual a alumno.

### `ForumShell`
Archivo:
- `src/components/forum/forum-shell.tsx`

Estado actual:
- muy completo, pero visualmente casi otro producto.

Se mantiene:
- estructura de comunidad por curso.

Se debe consolidar:
- lenguaje visual con campus.

Se debe evitar:
- que el foro tenga identidad separada del campus.

Refactor futuro:
- compartir más primitives con learning shell

## Shells
### Públicos
- `src/app/(public)/layout.tsx`

Mantener:
- header + footer públicos.

Pendiente:
- armonizar con auth y páginas de producto.

### Alumno
- `StudentAccountDashboard`
- `src/app/mis-cursos/page.tsx`
- `CourseLearningShell`

Diagnóstico:
- buen material, pero no un solo shell.

### Docente
- `TeacherAccountDashboard`
- `CourseLearningShell`
- `/mis-cursos/[slug]/seguimiento`

Diagnóstico:
- falta hub docente único.

### Admin
- `AdminShell`

Diagnóstico:
- shell más maduro.

## Cards custom relevantes
### `CourseCard`
Archivo:
- `src/components/course-card.tsx`

Mantener:
- estructura general.

Consolidar:
- CTA y spacing con el sistema.

Evitar:
- que evolucione aislada del resto del catálogo.

### `PurchaseCard`
Archivo:
- `src/components/purchase-card.tsx`

Mantener:
- composición clara de precio y beneficios.

Pendiente:
- acercarla al lenguaje del checkout y ficha de curso.

### Cards de dashboard alumno/docente
Archivos:
- `student-account-dashboard.tsx`
- `teacher-account-dashboard.tsx`
- `student-dashboard-shared.tsx`
- `teacher-dashboard-shared.tsx`

Diagnóstico:
- útiles, pero muy específicas.

Pendiente:
- extraer patrones de stat card, action card, panel contextual, list item.

### Cards de admin
Archivos:
- `src/components/admin/**/*`

Diagnóstico:
- consistentes entre sí, menos alineadas con público/alumno.

Pendiente:
- convertir tokens ad hoc en sistema semántico compartido.

## Formularios
### Auth
Archivo:
- `src/components/auth/auth-form.tsx`

Mantener:
- estructura simple y legible.

Consolidar:
- estados de error como pattern de sistema.

### Foro
Archivos:
- `thread-create-form.tsx`
- `thread-reply-form.tsx`
- `forum-thread-edit-form.tsx`
- `forum-post-edit-form.tsx`

Diagnóstico:
- alto riesgo de variación local.

Pendiente:
- unificar alertas, helper text, actions sticky y uploads.

### Admin
Archivos:
- `src/components/admin/**/*form*`

Diagnóstico:
- necesitan converger en layout y mensajes, aunque no urge en Fase B.

## Componentes duplicados o one-off
### Detectados
- Múltiples cards con `rounded-[24-32px]`, borde azul tenue y sombras similares.
- Múltiples pills de navegación implementadas localmente.
- Búsquedas y cajas de input estiladas fuera de `Input`.
- Empty states y states panels repetidos con clases inline.
- Métricas repetidas en alumno, docente, foro y admin.

### Qué se mantiene
- one-off realmente ligados a una visualización específica de dominio.

### Qué se debe consolidar
- stat cards
- action cards
- empty states
- state banners
- tabs
- navegación pills autenticadas

### Qué se debe evitar
- seguir creando wrappers locales con pequeñas diferencias de radio/sombra.
- introducir nuevos patrones sin revisar primero `ui/`.

## Refactors futuros prioritarios
- `Tabs` globales.
- `StatePanel` / `EmptyState`.
- `MetricCard`.
- `AuthenticatedHeader` por rol.
- `CourseShellNav`.
- extracción de patterns compartidos entre campus y foro.

## Decisión de Fase B
- No refactorizar todavía pantallas grandes.
- Sí estabilizar tokens y naming en primitives.
- Sí documentar la deuda visual y de IA para guiar Fase C.
