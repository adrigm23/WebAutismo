# Frontend Premium Migration v2

## Objetivo
Definir un plan operativo de migracion visual hacia un sistema premium, calmado, editorial y neuro-inclusivo para Autismo Cordoba sin tocar todavia codigo funcional, contratos de navegacion ni logica de producto.

Este documento fija el marco de ejecucion para una migracion progresiva del frontend actual. No autoriza cambios de backend, dominio, permisos, pagos ni rutas.

## Alcance
- Documentar el estado actual del frontend.
- Definir el nuevo sistema visual v2.
- Priorizar la migracion por componentes, shells y pantallas.
- Reducir riesgo de mezcla entre lenguaje visual antiguo y nuevo.
- Mantener la app funcional durante toda la transicion.

## Restricciones duras
- No tocar Prisma.
- No tocar auth.
- No tocar Stripe.
- No tocar storage.
- No tocar server actions.
- No tocar permisos ni roles.
- No cambiar contratos de URLs, hashes, tabs, redirects ni query params.
- No eliminar funcionalidades existentes.
- No implementar componentes en esta fase.
- No aplicar cambios visuales en esta fase.

## 1. Diagnostico actual

### 1.1 Estado general
- La aplicacion ya tiene una arquitectura real y madura de negocio.
- El frontend esta razonablemente componentizado por dominios: `account`, `learning`, `forum`, `admin`, `platform`, `ui`.
- Existe una base de tokens y primitives en `src/app/globals.css` y `src/components/ui/*`.
- Existen documentos internos previos de inventario y sistema visual:
  - `docs/ui-inventory.md`
  - `docs/design-system-v1.md`

### 1.2 Fortalezas actuales
- Buen desacoplamiento entre logica de dominio y presentacion.
- Uso de App Router y rutas ya estables.
- Existencia de primitives reutilizables para botones, cards, inputs, badges y submit states.
- Existencia de shells diferenciados para publico, cuenta, campus, foro y admin.
- Estados de loading y empty ya presentes en varias zonas del producto.

### 1.3 Problema principal
- El frontend no sufre por falta de componentes base, sino por divergencia visual entre areas.
- Distintas partes de la app resolvieron necesidades equivalentes con variantes locales.
- La consecuencia es una experiencia inconsistente entre alumno, docente, foro, admin y publico.

### 1.4 Problemas visuales detectados
- Exceso de cards visibles con borde + sombra + radio grande.
- Dependencia elevada de gradientes suaves y acentos azules mas presentes de lo deseado.
- Tipografia actual correcta pero no suficientemente editorial ni premium.
- Exceso de overlines, uppercase y patrones de metric card similares entre si.
- Falta de primitive global para tabs.
- Falta de primitive global para tablas, empty states, skeletons y field wrappers.
- Multiples estilos locales de estado, formularios, filas interactivas y paneles.
- Shells privados con identidades visuales separadas:
  - cabecera autenticada general
  - shell de campus
  - shell de foro
  - shell de admin
- La landing publica y la pagina de plataforma abren una subpaleta algo distinta del resto del producto.

### 1.5 Diagnostico por area

#### Layouts globales
- Base funcional correcta.
- Falta una capa shared que unifique tono, densidad, respiracion y jerarquia entre shells.

#### Headers publicos y privados
- Existen, pero cada familia resuelve el problema con su propio lenguaje.
- La navegacion autenticada aun no actua como sistema unico.

#### Sidebars
- Admin y foro tienen sidebars propias.
- El campus usa navegacion contextual con otro patron.
- No existe un vocabulario compartido de sidebar, rail o contextual nav.

#### Tabs
- Hay tabs locales en learning.
- Hay equivalentes visuales en otras pantallas, pero sin primitive compartida.

#### Cards
- Exceso de cardification.
- Variantes locales repetidas con leves diferencias de borde, radio, sombra y padding.

#### Botones
- Base correcta.
- Necesitan una calibracion visual v2 menos ruidosa y mas sobria.

#### Formularios
- Estructura correcta en muchas zonas.
- Sigue faltando una capa shared para label, helper, error, success y agrupacion de campos.

#### Tablas
- Admin tiene tablas funcionales.
- Falta un primitive o patron de data table alineado con el sistema general.

#### Modales
- No aparece un sistema modal claro y dominante.
- No se debe abrir este frente en Fase 1 salvo documentacion de patron futuro.

#### Empty states
- Ya existen en muchas zonas.
- Estan repetidos con clases inline y tono variable.

#### Skeletons y loaders
- Ya existen.
- Falta un lenguaje unificado de skeleton por shell.

#### Dashboard alumno
- Funcionalmente fuerte.
- Visualmente sigue demasiado basado en paneles y bloques destacados.

#### Mis cursos
- Buena arquitectura de flujo.
- Necesita mayor continuidad visual con `mi-cuenta` y con el campus.

#### Experiencia de leccion
- Es el area con mas potencial para expresar la nueva direccion premium.
- Hoy combina buen contenido con presentacion todavia bastante panelizada.

#### Recursos
- Operativamente completa.
- Visualmente densa y con muchas variantes locales.

#### Foro / comunidad
- Muy completo.
- Se siente como otro producto respecto al campus.

#### Seguimiento docente
- Muy funcional y valioso.
- Densidad alta y alto riesgo de deuda visual si se toca antes de consolidar tablas, metricas y banners.

#### Admin
- Shell maduro y usable.
- Mas sobrio que otras areas, pero aun no alineado con el nuevo lenguaje premium.

#### Catalogo publico
- Estructura clara.
- Sigue apoyado en course cards pesadas y patrones mas de catalogo clasico.

#### Ficha de curso
- Buena base editorial.
- Requiere ajuste de tipografia, tono y panel comercial para quedar dentro del nuevo sistema.

#### Checkout
- Flujo correcto y delicado.
- Debe migrarse tarde para no arriesgar conversion ni contratos.

#### Login / registro
- Base limpia y funcional.
- Necesita integrarse con la nueva tipografia, superficies y tono general.

## 2. Principios visuales del nuevo sistema

### Principios rectores
- Una sola plataforma, varios contextos.
- Interfaz silenciosa.
- Baja carga cognitiva.
- Contenido primero, contenedor despues.
- Jerarquia limpia antes que decoracion.
- Mucho espacio negativo.
- Elevacion tonal sutil.
- Acciones claras pero discretas.
- Accesibilidad real, no cosmetica.
- Continuidad entre alumno, docente, comunidad y admin.

### Direccion estetica
- SaaS premium sobrio, no startup brillante.
- Influencias: Linear, Stripe, Notion, Arc.
- Fondo marfil o blanco calido.
- Tipografia sans contemporanea y clara.
- Menos bordes visibles.
- Menos cards pesadas.
- Mayor uso de divisores, ritmo y composicion.
- Estados activos discretos pero inequívocos.
- Comunidad moderna y limpia, no foro antiguo.
- Leccion centrada en lectura, progreso y continuidad.

### Principios neuro-inclusivos
- Reduccion de ruido visual.
- Densidad controlada por contexto.
- Ritmo vertical estable.
- Jerarquia predecible.
- Menor saturacion de color.
- Foco visible y consistente.
- Mensajes de error y estados claros.
- Navegacion contextual comprensible.
- Evitar cambios bruscos de tono entre areas.

## 3. Tokens v2 propuestos

### 3.1 Tipografia
- Fuente principal propuesta: `Plus Jakarta Sans`.
- Fuente mono secundaria para metricas y tablas: `JetBrains Mono` o equivalente similar si ya existe una alternativa compatible.
- Escala recomendada:
  - `display-xl`
  - `display-lg`
  - `display-md`
  - `heading-lg`
  - `heading-md`
  - `body-lg`
  - `body-md`
  - `body-sm`
  - `label-sm`
  - `meta-xs`
- Reglas:
  - tracking negativo solo en displays y metricas protagonistas
  - tabular nums en metricas y tablas
  - menos uppercase decorativo

### 3.2 Color
- `--color-bg-app`
- `--color-bg-subtle`
- `--color-surface`
- `--color-surface-elevated`
- `--color-surface-muted`
- `--color-ink`
- `--color-ink-soft`
- `--color-ink-muted`
- `--color-border-subtle`
- `--color-border-strong`
- `--color-brand`
- `--color-brand-strong`
- `--color-brand-soft`
- `--color-accent-warm`
- `--color-accent-warm-soft`
- `--color-success`
- `--color-success-soft`
- `--color-warning`
- `--color-warning-soft`
- `--color-danger`
- `--color-danger-soft`

### 3.3 Spacing
- Escala base: `4, 8, 12, 16, 24, 32, 48, 64`
- Regla por contexto:
  - publico: aireado
  - alumno/docente: medio
  - admin: medio-alto, nunca comprimido en exceso

### 3.4 Radius
- `--radius-sm: 12px`
- `--radius-md: 16px`
- `--radius-lg: 24px`
- `--radius-xl: 32px`
- `--radius-pill: 9999px`

### 3.5 Shadows y elevacion
- `--shadow-soft`
- `--shadow-medium`
- `--shadow-overlay`
- Regla:
  - sombras suaves y escasas
  - priorizar elevacion tonal frente a sombra visible

### 3.6 Motion
- Duraciones base: `160ms`, `200ms`, `220ms`
- Easing suave y consistente
- Hover y pressed tactiles pero discretos
- Sin animacion ornamental en Fase 1

### 3.7 Layout
- `--container-public`
- `--container-app`
- `--sidebar-width-admin`
- `--sidebar-width-community`
- `--topbar-height`
- `--focus-ring`
- `--z-header`
- `--z-overlay`

## 4. Componentes base a crear o refactorizar

### 4.1 Refactorizar
- `ui/button`
- `ui/card`
- `ui/surface-card`
- `ui/input`
- `ui/textarea`
- `ui/badge`
- `ui/submit-button`

### 4.2 Crear
- `ui/tabs`
- `ui/form-field`
- `ui/empty-state`
- `ui/state-banner`
- `ui/skeleton`
- `ui/data-table`
- `ui/metric-panel`
- `ui/list-row`
- `ui/section-header`

### 4.3 Patrones shared a extraer
- stat card
- action tile
- activity item
- summary rail block
- empty state panel
- loading block
- error inline panel
- editable form section
- paginated list footer

## 5. Shells / layouts a unificar

### Shell publico
- Header publico
- Footer publico
- Contenedor y ritmo de landing, catalogo, ficha y auth

### Shell autenticado general
- Topbar autenticada
- User identity block
- Context actions row
- Role-aware nav pattern

### Shell campus
- Header del curso
- Tabs del campus
- Intro de leccion
- Layout de contenido + recursos + comunidad

### Shell comunidad
- Topbar de comunidad
- Sidebar / category rail
- Notification panel
- Composer / thread / reply pattern

### Shell admin
- Sidebar admin
- Topbar admin
- Search row
- Page header
- Metric row
- Data table zone

### Decision
- No forzar un shell unico para todos.
- Si forzar una misma familia de tokens, tipografia, controles, nav items, panels y estados.

## 6. Plan por fases

### Fase 1. Design System base
- Definir tokens v2
- Definir tipografia v2
- Normalizar colores, spacing, radius, shadows, motion
- Refactorizar primitives base
- Crear tabs, field wrappers, empty states, skeletons, metric panels y data tables
- Definir shells base:
  - publico
  - autenticado
  - campus
  - comunidad
  - admin

### Fase 2. Student experience
- `mi-cuenta`
- `mis-cursos`
- detalle de curso privado
- experiencia de leccion
- recursos

### Fase 3. Comunidad
- home foro
- categoria
- hilo
- responder
- nuevo hilo
- notificaciones

### Fase 4. Publico y compra
- home publica
- catalogo
- ficha de curso
- checkout
- login
- registro
- recuperar / restablecer contraseña

### Fase 5. Docente / Admin
- seguimiento docente
- dashboard admin
- usuarios
- cursos
- ediciones
- promociones
- auditoria
- supervision

## 7. Primera fase exacta

### Objetivo de la fase
Crear la capa de sistema visual v2 sin aplicar aun la migracion completa a pantallas grandes.

### Entregables de Fase 1
- Documento v2 consolidado
- Tokens v2 definidos
- Escala tipografica v2 definida
- Naming semantico unico de variantes visuales
- Lista de primitives a refactorizar
- Lista de primitives nuevas a crear
- Decision de shells compartidos
- Criterios de adopcion por pantalla

### Orden recomendado dentro de Fase 1
1. Consolidar documentacion v2.
2. Revisar `globals.css` y naming de tokens actuales.
3. Diseñar la matriz de primitives shared.
4. Diseñar la matriz de shells shared.
5. Elegir pantallas piloto para adopcion futura.

### Pantallas piloto recomendadas para la siguiente fase
- `mi-cuenta`
- `mis-cursos`
- header autenticado general

### Razones
- Alta cobertura visual.
- Bajo riesgo de contratos delicados.
- Reutilizacion inmediata sobre campus, foro y docente.

## 8. Archivos candidatos

### Base global
- `src/app/globals.css`
- `src/app/layout.tsx`
- `docs/ui-inventory.md`
- `docs/design-system-v1.md`

### UI base
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/surface-card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/submit-button.tsx`

### Shell publico
- `src/app/(public)/layout.tsx`
- `src/components/site-header.tsx`
- `src/components/site-footer.tsx`

### Shell autenticado
- `src/components/account/account-auth-header.tsx`

### Shell campus
- `src/components/learning/course-learning-shell.tsx`
- `src/components/learning/course-learning-shell/course-learning-header.tsx`
- `src/components/learning/course-learning-shell/primitives.tsx`
- `src/components/learning/course-learning-shell/course-learning-panels.tsx`

### Shell comunidad
- `src/components/forum/forum-shell.tsx`

### Shell admin
- `src/components/admin/admin-shell.tsx`
- `src/components/admin/admin-page-header.tsx`

### Alumno / docente
- `src/components/account/student-account-dashboard.tsx`
- `src/components/account/student-dashboard-shared.tsx`
- `src/components/account/teacher-account-dashboard.tsx`
- `src/components/account/teacher-dashboard-shared.tsx`
- `src/app/mi-cuenta/page.tsx`
- `src/app/mis-cursos/page.tsx`

### Comunidad
- `src/app/mis-cursos/[slug]/foro/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/[threadId]/page.tsx`
- `src/components/forum/thread-create-form.tsx`
- `src/components/forum/thread-reply-form.tsx`

### Publico y compra
- `src/components/course-card.tsx`
- `src/components/purchase-card.tsx`
- `src/components/auth/split-auth-panel.tsx`
- `src/components/auth/auth-form.tsx`
- `src/app/(public)/page.tsx`
- `src/app/(public)/cursos/page.tsx`
- `src/app/(public)/cursos/[slug]/page.tsx`
- `src/app/checkout/[slug]/page.tsx`
- `src/components/platform/home/home-landing.tsx`
- `src/components/platform/home/home-hero.tsx`

### Admin y operaciones
- `src/app/admin/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/mis-cursos/[slug]/seguimiento/page.tsx`
- `src/components/admin/courses/course-table-card.tsx`

## 9. Riesgos

### Riesgos de diseño
- Mezclar estilos v1 y v2 sin capa shared previa.
- Sobrediseñar una sola pantalla y romper coherencia sistémica.
- Llevar demasiado pronto una estetica comercial al admin o al seguimiento.

### Riesgos tecnicos
- Romper anchors, hashes y query params del campus y foro.
- Introducir wrappers nuevos que cambien semantica o estructura accesible sin plan.
- Duplicar primitives en vez de refactorizar las existentes.
- Crear nuevas variantes locales en lugar de consolidar las shared.

### Riesgos de producto
- Tocar checkout demasiado pronto y afectar conversion o claridad.
- Tocar seguimiento docente antes de cerrar tabla, densidad y metricas.
- Tratar foro y campus como productos distintos.

## 10. Validaciones

### Visuales
- Revision en 390px
- Revision en 768px
- Revision en 1024px
- Revision en 1280px
- Comparacion de consistencia entre shells

### Funcionales
- Mantener navegacion y contratos actuales
- Mantener anchors actuales
- Mantener query params actuales
- Mantener continuidad de tabs y redirects

### Accesibilidad
- foco visible
- contraste suficiente
- navegacion por teclado
- lectura clara de formularios
- estados error/loading/empty/success consistentes

### QA futura recomendada
- smoke de login
- smoke de catalogo
- smoke de checkout
- smoke de campus
- smoke de foro
- smoke de admin

## 11. Que NO tocar
- `prisma/**`
- `src/actions/**`
- `src/app/api/**`
- auth
- Stripe
- storage
- permisos
- roles
- server actions
- helpers de navegacion
- contratos de URL
- redirects
- tabs funcionales
- hashes funcionales
- query params funcionales

## 12. Plan de commits recomendado

1. `docs: define frontend premium migration v2`
2. `docs: align design-system-v1 and ui inventory with migration plan`
3. `feat(ui): introduce premium tokens v2`
4. `refactor(ui): normalize base primitives for v2`
5. `feat(ui): add tabs skeleton empty-state state-banner and data-table`
6. `refactor(shell): unify public authenticated campus community and admin shell patterns`
7. `refactor(student): migrate account and my-courses to v2`
8. `refactor(campus): migrate lesson and resources experience`
9. `refactor(community): migrate forum flows to v2`
10. `refactor(public): migrate home catalog course page checkout and auth`
11. `refactor(admin): migrate teacher tracking and admin console to v2`

## Criterio de salida de esta fase documental
- Existe un documento operativo unico dentro del repo.
- El plan deja claro que se migra primero, que se migra despues y que no debe tocarse.
- El siguiente paso puede ejecutarse por fases sin improvisar arquitectura visual.
