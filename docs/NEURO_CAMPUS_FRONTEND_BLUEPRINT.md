# Neuro Campus Frontend Blueprint

## 0. Scope

Este documento define el blueprint tecnico para un campus educativo neuro-inclusivo premium sobre:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Hook Form
- Zod
- Prisma
- PostgreSQL

No prescribe una implementacion completa de pantallas. Su objetivo es fijar:

- sistema visual
- arquitectura frontend
- estructura de carpetas
- design system tecnico
- patrones reutilizables
- estrategia responsive
- accesibilidad WCAG AA
- performance y escalabilidad

Tambien aterriza esas decisiones sobre la realidad actual del repositorio.

## 0.1 Estado actual del repo

Lo que ya esta bien encaminado:

- `src/components/ui/**` ya funciona como nucleo de primitives.
- `src/app/globals.css` ya tiene una primera capa de tokens.
- `forum` y parte de `ui` ya operan con una logica visual bastante consistente.
- App Router, server actions y separacion de `app` / `components` / `lib` ya existen.

Lo que hoy genera deriva:

- `learning` y dashboards mezclan lenguaje v2 con legacy.
- persisten botones inline, estados por hex y superficies resueltas localmente.
- la paleta actual del repo es mas calida que la de las referencias visuales.
- no existe todavia una taxonomia completa de shells reutilizables.

## 0.2 Brecha actual frente al stack objetivo

Segun `package.json`, hoy faltan o no estan explicitamente integrados:

- `framer-motion`
- `react-hook-form`
- `@hookform/resolvers`
- setup real de shadcn/ui

Decision:

- el blueprint se disena para ese stack objetivo;
- la implantacion debe empezar por completar esa base tecnica antes de multiplicar paginas.

## 1. Lectura del sistema visual de las referencias

## 1.1 Tono de producto

Las referencias no son un SaaS agresivo ni una UI de consumo masivo. El lenguaje es:

- institucional moderno
- premium sobrio
- cognitivamente calmado
- limpio, pero no vacio
- altamente legible

La sensacion correcta es "campus confiable y claro", no "startup brillante", no "admin frio", no "landing generica".

## 1.2 Reglas visuales que se repiten

- Fondo general muy claro, ligeramente frio, nunca blanco puro en toda la pagina.
- Superficies principales blancas o casi blancas.
- Accion primaria en teal profundo / navy petrol.
- Acento secundario dorado muy contenido.
- Tipografia amable, redondeada y editorial, con tracking ajustado en headings.
- Bordes finos y suaves; poca dependencia de sombras pesadas.
- Radios amplios, pero controlados.
- Secciones con mucho orden interno y baja friccion visual.
- Una sola accion principal por bloque.
- Jerarquia apoyada mas por espacio, contraste y tamano que por decoracion.

## 1.3 Spacing y densidad

La densidad correcta no es minimalismo de galeria ni cockpit de backoffice.

Objetivo:

- `comfortable` por defecto en autenticacion, checkout, onboarding y campus overview
- `balanced` en learning workspace
- `compact-controlled` solo en admin y tablas, sin perder aire

Patron observado:

- bloques grandes: 48-72 px
- separacion entre regiones de una misma superficie: 24-32 px
- agrupacion de controles: 12-16 px
- campos de formulario: ritmo vertical estable y repetible

## 1.4 Jerarquia

Jerarquia primaria:

1. orientacion de pagina
2. tarea actual
3. siguiente paso
4. contexto secundario
5. metadata

La referencia evita:

- muchos CTAs simultaneos
- sidebars ruidosas
- badges decorativos
- info secundaria con el mismo peso que el contenido

## 1.5 Layouts base presentes en las referencias

Se repiten cinco shells:

1. `Auth Split Shell`
   - izquierda funcional, derecha institucional
   - ideal para login

2. `Auth Centered Card Shell`
   - marca arriba, card central, microcopy de soporte abajo
   - ideal para registro, reset, verificacion

3. `Checkout Transaction Shell`
   - formulario principal + resumen lateral
   - CTA persistente al final del flujo

4. `Success / Confirmation Shell`
   - contenido centrado, resumen institucional, siguiente paso claro

5. `Campus Overview Shell`
   - hero breve
   - panel principal de programa
   - rail lateral de estado / ayuda
   - recursos siguientes en bandas claras

## 1.6 Patrones UX neuro-inclusivos implicitos

- Predictibilidad de layout.
- Progreso por pasos explicito.
- Acciones importantes visibles sin competir con secundarias.
- Copys directos y concretos.
- Poca saturacion cromatica.
- Iconografia funcional, no ornamental.
- Formularios lineales, sin saltos bruscos.
- Bloques acotados visualmente para reducir carga cognitiva.

## 2. Principios rectores del campus

## 2.1 Principios de producto

- Calma cognitiva antes que espectacularidad.
- Una sola plataforma, varios contextos.
- El contenido y la tarea mandan sobre el chrome.
- Cada pantalla debe responder: donde estoy, que sigue, que requiere atencion.
- No usar novedad visual si perjudica predicibilidad.

## 2.2 Principios tecnicos

- Server Components por defecto.
- Client Components solo en hojas interactivas.
- URL como fuente de verdad para tabs, filtros y workspace state cuando aplique.
- Tokens semanticos antes que hex directos.
- Primitives unicas para inputs, buttons, badges, panels y feedback.
- Layouts reutilizables antes que paginas one-off.

## 3. Arquitectura frontend objetivo

## 3.1 Regla de composicion

La arquitectura debe separar cinco capas:

1. `app`
   - routing, metadata, data loading, page assembly

2. `features`
   - dominio de producto
   - UI compuesta
   - schemas, actions adapters y presenters por area

3. `components`
   - primitives y layout building blocks compartidos

4. `lib` / `server`
   - utilidades, acceso a datos, auth, permisos, servicios

5. `styles` / tokens
   - variables, semantic aliases, motion, density y theming

## 3.2 Estructura propuesta

```text
src/
  app/
    (public)/
    (auth)/
    (checkout)/
    (campus)/
    (admin)/
    api/
    layout.tsx
    globals.css
  components/
    ui/
    layout/
    navigation/
    feedback/
  features/
    auth/
      components/
      schemas/
      actions/
      queries/
      types.ts
    onboarding/
    checkout/
    campus/
    learning/
    forum/
    account/
    admin/
    shared/
  lib/
    auth/
    permissions/
    formatting/
    utils/
    config/
  server/
    db/
    repositories/
    services/
    presenters/
  styles/
    tokens.css
    themes.css
    motion.css
```

## 3.3 Compatibilidad con el repo actual

No hace falta un big-bang refactor.

Migracion recomendada:

- mantener `src/components/ui/**` como base compartida
- tratar `src/components/auth`, `learning`, `forum`, `account`, `admin` como proto-features
- introducir `src/features/**` solo para lo nuevo o para zonas que entren en normalizacion
- mantener `src/app/**` delgado: cada `page.tsx` debe ensamblar, no contener grandes arboles visuales

## 3.4 Route groups recomendados

```text
app/
  (public)/
    page.tsx
    cursos/
    plataforma/
  (auth)/
    acceder/
    registro/
    recuperar-contrasena/
    restablecer-contrasena/
    verificar-email/
  (checkout)/
    checkout/[slug]/
    checkout/exito/
  (campus)/
    mi-cuenta/
    mis-cursos/
  (admin)/
    admin/
```

Esto permite aplicar shells y metadata coherentes por contexto sin mezclar estilos de pagina.

## 4. Design system tecnico

## 4.1 Capas de tokens

Usar tres capas:

1. primitives
   - color crudo, radius, shadow, spacing, type, z-index

2. semantic
   - background, surface, border, text, action, success, warning, danger

3. component alias
   - button-primary-bg, card-border, field-focus-ring, sidebar-active-bg

Regla:

- las features solo consumen semantic y component alias
- primitives solo se tocan en `tokens.css`

## 4.2 Direccion cromatica recomendada

Las referencias empujan a una base fria-luminosa. Para este campus, la direccion correcta es:

- fondo institucional claro con tinte lavanda-gris muy sutil
- superficies blancas
- tinta navy profunda
- marca teal-petrol
- acento dorado reservado

No conviene seguir abriendo la paleta beige actual si el objetivo es parecerse al sistema de referencia.

## 4.3 Tokens base recomendados

```css
:root {
  --bg-canvas: #f7f5fb;
  --bg-subtle: #f1eef8;
  --surface-base: #ffffff;
  --surface-soft: #f6f4fb;
  --surface-strong: #ffffff;

  --ink-primary: #102231;
  --ink-secondary: #586574;
  --ink-tertiary: #7b8694;
  --ink-inverse: #f8fbfd;

  --border-subtle: #dde3eb;
  --border-default: #cfd7e1;
  --border-strong: #b6c1cd;

  --brand-700: #0c3042;
  --brand-600: #123d53;
  --brand-500: #1c5874;
  --brand-100: #dde9f0;

  --accent-600: #c99b1d;
  --accent-100: #f5edd5;

  --success-600: #0f8b84;
  --success-100: #daf1ee;
  --warning-600: #9a6b10;
  --warning-100: #f8eed2;
  --danger-600: #a54a38;
  --danger-100: #f9e7e3;

  --focus-ring: rgba(18, 61, 83, 0.18);
}
```

## 4.4 Semantica de color

```css
:root {
  --color-background: var(--bg-canvas);
  --color-background-subtle: var(--bg-subtle);
  --color-surface: var(--surface-base);
  --color-surface-soft: var(--surface-soft);

  --color-text: var(--ink-primary);
  --color-text-muted: var(--ink-secondary);
  --color-text-subtle: var(--ink-tertiary);
  --color-text-inverse: var(--ink-inverse);

  --color-border: var(--border-default);
  --color-border-subtle: var(--border-subtle);
  --color-border-strong: var(--border-strong);

  --color-primary: var(--brand-600);
  --color-primary-strong: var(--brand-700);
  --color-primary-soft: var(--brand-100);

  --color-accent: var(--accent-600);
  --color-accent-soft: var(--accent-100);

  --color-success: var(--success-600);
  --color-success-soft: var(--success-100);
  --color-warning: var(--warning-600);
  --color-warning-soft: var(--warning-100);
  --color-danger: var(--danger-600);
  --color-danger-soft: var(--danger-100);
}
```

## 4.5 Tipografia

### Recomendacion

- `Plus Jakarta Sans` como fuente principal de UI
- `Manrope` como apoyo opcional para bloques de lectura larga si hace falta
- `JetBrains Mono` solo para datos, IDs, importes y timestamps tecnicos

### Escala recomendada

```text
display-xl   56/60
display-lg   44/52
headline-xl  32/40
headline-lg  24/32
headline-md  20/28
body-lg      18/30
body-md      16/28
body-sm      14/24
label-md     14/20
label-sm     13/18
meta-xs      12/16 uppercase
```

### Reglas

- tracking negativo solo en display y grandes headings
- labels y controles con pesos medios consistentes
- longitud de linea en texto explicativo: `50ch` a `68ch`
- nunca depender del placeholder como label

## 4.6 Spacing

Escala base:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96
```

Mapeo:

- `gap-2` = microacciones
- `gap-3` = grupos compactos
- `gap-4` = controls / rows
- `gap-6` = subbloques
- `gap-8` = bloques principales
- `gap-12` = secciones
- `gap-16` = aperturas grandes

## 4.7 Radius

```text
radius-xs   10px
radius-sm   14px
radius-md   18px
radius-lg   24px
radius-xl   32px
radius-pill 999px
```

Uso:

- fields y buttons: `md`
- cards y panels: `lg`
- hero cards o contenedores destacados: `xl`
- chips y badges: `pill`

## 4.8 Elevacion

La referencia usa muy poca sombra. El sistema debe vivir en borde + contraste + pequenas elevaciones.

```css
:root {
  --shadow-xs: 0 1px 2px rgba(16, 34, 49, 0.04);
  --shadow-sm: 0 10px 24px rgba(16, 34, 49, 0.05);
  --shadow-md: 0 18px 40px rgba(16, 34, 49, 0.08);
  --shadow-lg: 0 24px 56px rgba(16, 34, 49, 0.10);
}
```

Regla:

- `shadow-sm` por defecto
- `shadow-md` solo para interactivos destacados o overlays
- no usar glows

## 4.9 Motion tokens

```css
:root {
  --motion-fast: 140ms;
  --motion-base: 180ms;
  --motion-slow: 240ms;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

## 5. Sistema de componentes

## 5.1 Taxonomia

### A. Primitives

- `Button`
- `Input`
- `Textarea`
- `Checkbox`
- `RadioGroup`
- `Select`
- `Badge`
- `Tabs`
- `Dialog`
- `Tooltip`
- `Skeleton`
- `Progress`
- `Separator`

### B. Composed form building blocks

- `FormField`
- `FieldMessage`
- `FieldGroup`
- `PasswordField`
- `InlineChoiceGroup`
- `ConsentBlock`

### C. Content / surface building blocks

- `SurfaceCard`
- `Panel`
- `MetricPanel`
- `SectionHeader`
- `EmptyState`
- `StateBanner`
- `SummaryList`

### D. Layout components

- `PageHeader`
- `PageSection`
- `ContentRail`
- `StickyAside`
- `ShellFrame`
- `SidebarNav`
- `Topbar`

### E. Flow-specific templates

- `AuthSplitShell`
- `AuthCenteredShell`
- `CheckoutShell`
- `EnrollmentSuccessShell`
- `CampusOverviewShell`
- `LearningWorkspaceShell`
- `AdminWorkspaceShell`

## 5.2 Regla de ownership

- `ui/**` solo primitives y wrappers neutrales
- `layout/**` solo estructura
- `features/**/components` solo UI con semantica de dominio
- una feature no importa componentes internos de otra feature salvo a traves de `shared`

## 5.3 Componente no permitido

No introducir:

- cards one-off con radio/sombra/spacing hardcodeados
- botones estilados inline
- badges sin primitive
- paneles de estado montados con hex directos
- tabs locales que no usen el patron del sistema

## 6. Shells reutilizables

## 6.1 Auth Split Shell

Uso:

- `/acceder`

Composicion:

- columna izquierda: login real
- columna derecha: mensaje institucional, valor y calma

Reglas:

- en mobile colapsa a una sola columna
- el mensaje institucional baja debajo o desaparece segun prioridad

## 6.2 Auth Centered Shell

Uso:

- `/registro`
- `/recuperar-contrasena`
- `/restablecer-contrasena`
- `/verificar-email`

Composicion:

- marca compacta superior
- card central
- nota de privacidad / soporte inferior

## 6.3 Checkout Shell

Uso:

- `checkout/[slug]`

Composicion:

- contenido principal ancho
- sidebar sticky con resumen
- CTA al final del bloque transaccional

Regla:

- en tablet y mobile el resumen baja debajo del formulario

## 6.4 Confirmation Shell

Uso:

- `checkout/exito`
- confirmaciones institucionales

Composicion:

- foco central
- resumen claro del programa
- siguientes pasos
- CTA unico

## 6.5 Campus Overview Shell

Uso:

- `mi-cuenta`
- home de alumno/docente

Composicion:

- intro breve
- panel principal de programa o estado
- aside con onboarding y ayuda
- bandas de recursos y actividad

## 6.6 Learning Workspace Shell

Uso:

- `mis-cursos/[slug]`

Composicion objetivo:

- top contextual compacto
- columna principal de aprendizaje
- rail lateral de recursos / progreso / comunidad
- tabs de workspace persistentes

Regla clave:

- learning no debe usar un lenguaje mas frio o mas tecnico que el resto del campus

## 7. Estrategia responsive

## 7.1 Breakpoints

```text
sm  640
md  768
lg  1024
xl  1280
2xl 1440
```

## 7.2 Containers

```text
public      max-w-[1280px]
app         max-w-[1360px]
reading     max-w-[760px]
form        max-w-[640px]
checkout    max-w-[1240px]
```

## 7.3 Reglas generales

- Mobile first.
- Una columna antes de `md` salvo necesidad fuerte.
- Sidebars y asides nunca deben bloquear la tarea principal en mobile.
- Las secciones deben conservar orden semantico al colapsar.
- Evitar cambios radicales de patron entre tablet y desktop.

## 7.4 Comportamiento por shell

### Auth split

- `lg+`: dos columnas 50/50 o 52/48
- `<lg`: una sola columna, mensaje institucional secundario

### Checkout

- `lg+`: `2fr / 1fr`
- `md`: stack con resumen debajo
- `sm`: CTA full width y campos en una sola columna

### Campus overview

- `xl`: principal + rail
- `lg`: rail inferior o lateral compacta
- `sm`: todo en una columna con orden de prioridad

### Learning

- `lg+`: workspace con rail secundaria
- `<lg`: tabs y paneles secuenciales
- evitar sidebars de ancho fijo incontrolable

## 8. Accesibilidad WCAG AA

## 8.1 Basicos no negociables

- contraste AA en texto y controles
- focus visible consistente en todos los interactivos
- orden de tab estable
- labels reales en formularios
- errores conectados por `aria-describedby`
- landmarks semanticos: `header`, `nav`, `main`, `aside`, `footer`

## 8.2 Neuro-inclusividad operativa

- una sola accion primaria por bloque o viewport
- evitar animacion autonoma innecesaria
- evitar carruseles automaticos
- mensajes de error claros y concretos
- longitud de parrafo controlada
- icono + texto en estados, no solo color
- progresion por pasos visible en checkout y onboarding

## 8.3 Preferencias de usuario recomendadas

Crear un `AccessibilityPreferencesProvider` con:

- `reducedMotion`
- `highContrast`
- `comfortableSpacing`
- `focusMode`

No hace falta abrir todas estas opciones en la primera fase, pero la arquitectura debe permitirlo.

## 9. Estado global y gestion de datos

## 9.1 Regla principal

No convertir el campus en una SPA client-heavy.

Jerarquia de estado:

1. server state
   - session
   - user
   - role
   - permissions
   - curso actual
   - progreso persistido

2. URL state
   - tabs
   - filtros
   - modulo seleccionado
   - recurso focalizado

3. local UI state
   - expand/collapse
   - dialogs
   - form drafts locales
   - toasts

## 9.2 Stores globales minimamente justificadas

Solo dos providers globales son razonables:

- `SessionProvider` o equivalente si hace falta UI client-side dependiente de sesion
- `PreferencesProvider` para accesibilidad, motion y density

Evitar una store global para todo el producto.

## 10. Formularios

## 10.1 Stack recomendado

- `react-hook-form`
- `zod`
- `@hookform/resolvers/zod`

## 10.2 Estructura

Cada form debe componerse con:

- schema `zod`
- `defaultValues`
- field primitives
- mensajes inline
- CTA final
- success/error feedback claro

## 10.3 Patron visual

- label arriba
- helper opcional debajo del control
- error debajo del helper o sustituyendolo
- iconos solo si suman orientacion
- feedback de password strength no invasivo

## 10.4 Reglas UX

- validar en blur o submit, no en cada pulsacion salvo casos concretos
- mostrar error junto al campo
- conservar datos si el submit falla
- no bloquear con modales para errores simples

## 11. Autenticacion y autorizacion

## 11.1 Arquitectura

- autenticacion en servidor
- cookie httpOnly
- resolucion de sesion en layouts protegidos
- guards por route group

## 11.2 Modelo de acceso

Separar:

- `role`
- `capabilities`
- `currentContext`

Ejemplo:

- un docente y un admin pueden compartir capacidades parciales sin compartir shell completo

## 11.3 Flujos a estandarizar

- login
- registro
- reset
- verificacion email
- pending verification
- acceso post-compra
- cierre de sesion con retorno predecible

## 12. Theming

## 12.1 Decision recomendada

No abrir dark mode en la primera fase.

Para este producto el mejor enfoque es:

- tema claro institucional como default y unico tema visual principal
- soporte para variaciones de marca por organizacion
- soporte para ajustes de contraste, densidad y motion por preferencia

## 12.2 Ejes de theme

Usar atributos de datos:

```html
<body
  data-brand="autismo-cordoba"
  data-density="comfortable"
  data-motion="default"
  data-contrast="default"
>
```

Esto permite:

- white-label institucional
- sin romper primitives
- sin duplicar componentes por marca

## 13. Estrategia de animacion

## 13.1 Rol de Framer Motion

Usarlo solo donde mejora claridad:

- entrada suave de pagina
- reveals de bloques
- expand/collapse
- dialogs y drawers
- progreso y feedback de acciones

## 13.2 Motion bar

La referencia pide microinteraccion sobria, no showreel.

Permitido:

- fade + y-translate de 8-12 px
- hover con `-translate-y-[1px]`
- progress bars suaves
- stagger corto en listas

Evitar:

- parallax
- floating infinito
- bouncing
- loaders ruidosos
- transiciones largas

## 13.3 Reduced motion

Todo patron animado debe respetar `prefers-reduced-motion`.

## 14. Performance

## 14.1 Reglas de base

- RSC por defecto
- data fetching en servidor
- client leaves pequenos
- imports dinamicos para zonas pesadas
- skeletons en lugar de spinners globales

## 14.2 Puntos sensibles del producto

- learning workspace
- admin tablas y filtros
- checkout y validaciones
- foro con listas largas

## 14.3 Reglas concretas

- no hidratar shells completos si solo cambian paneles internos
- usar URL state antes que stores pesadas
- memoizar listas interactivas solo donde haya medicion que lo justifique
- evitar icon packs o chart libs si no son necesarias
- optimizar fuentes y limitar variantes

## 15. Convenciones de codigo

## 15.1 Naming

- `*-shell.tsx` para contenedores de layout
- `*-panel.tsx` para bloques de superficie
- `*-card.tsx` para items encapsulados
- `*-form.tsx` para formularios completos
- `*-field.tsx` para building blocks de field
- `types.ts`, `schemas.ts`, `constants.ts` por feature

## 15.2 Convenciones React

- Server Component por defecto
- `"use client"` solo en hojas interactivas
- props pequenas y explicitas
- evitar componentes gigantes de 400+ lineas salvo shell contenedora excepcional

## 15.3 Convenciones de estilos

- sin hex inline en features
- sin radios hardcodeados
- sin sombras ad hoc
- sin `style={{}}` salvo calculo dinamico justificado
- una variante visual nueva requiere primitive o alias semantico

## 15.4 Convenciones de dominio

- schemas Zod junto a la feature
- acciones server junto a la feature o en `src/actions/**` con ownership claro
- presenters para adaptar datos de DB a UI
- permisos no resueltos dentro del JSX

## 16. Plan de implantacion recomendado

## 16.1 Fase 0

- completar stack objetivo: RHF, resolvers, Framer Motion, shadcn setup
- congelar nuevos hex y nuevos botones inline

## 16.2 Fase 1

- alinear tokens globales con la direccion fria-luminosa de referencia
- cerrar primitives: button, input, textarea, checkbox, badge, tabs, progress

## 16.3 Fase 2

- consolidar shells:
  - auth split
  - auth centered
  - checkout
  - success
  - campus overview

## 16.4 Fase 3

- normalizar `learning`
- reducir nested surfaces
- mover estados a semantica
- unificar tabs, sidebars y panels

## 16.5 Fase 4

- endurecer admin con el mismo lenguaje premium, sin volverlo marketing

## 17. Decisiones inmediatas para este repo

1. Mantener `src/components/ui/**` como nucleo oficial.
2. No abrir mas variantes locales en `learning`, `account` o `admin`.
3. Convertir auth, checkout y success en shells canonicos porque las referencias ya los definen con claridad.
4. Reorientar la paleta desde beige calido a claro frio institucional para acercar producto y referencias.
5. Tratar `learning` como siguiente zona critica de convergencia visual y estructural.

## 18. Criterio de exito

La arquitectura sera correcta si en las siguientes iteraciones conseguimos:

- nuevas pantallas sin crear primitives paralelas
- formularios y estados consistentes entre auth, checkout y campus
- learning y dashboards absorbidos por el mismo lenguaje visual
- una UI premium, calmada y mantenible sin perder rendimiento
