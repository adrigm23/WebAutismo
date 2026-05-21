# Community V2 Visual System

## Objetivo
Este documento fija la fuente de verdad visual del producto a partir de la implementacion real de Comunidad V2. No define una direccion futura abstracta: documenta el sistema que ya existe en codigo y que debe reutilizarse para extender el producto sin introducir inconsistencias.

## Alcance
- Basado unicamente en la implementacion actual de Comunidad V2.
- No propone patrones nuevos.
- No redefine backend, negocio ni arquitectura de rutas.
- Sirve como guia operativa para extender el sistema hacia otras areas del producto.

## Archivos auditados
- `src/app/globals.css`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/surface-card.tsx`
- `src/components/ui/section-header.tsx`
- `src/components/ui/form-field.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/state-banner.tsx`
- `src/components/ui/empty-state.tsx`
- `src/components/ui/metric-panel.tsx`
- `src/components/ui/submit-button.tsx`
- `src/components/ui/confirm-submit-button.tsx`
- `src/components/forum/forum-shell.tsx`
- `src/components/forum/forum-thread-composer.tsx`
- `src/components/forum/thread-create-form.tsx`
- `src/components/forum/thread-reply-form.tsx`
- `src/app/mis-cursos/[slug]/foro/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/[threadId]/page.tsx`
- `src/app/mis-cursos/[slug]/foro/nuevo/page.tsx`
- `src/app/mis-cursos/[slug]/foro/[categorySlug]/nuevo/page.tsx`

## 1. Filosofia visual del producto

### Tono
- Premium sobrio, no tecnologico ruidoso.
- Calma antes que impacto.
- Editorial antes que dashboard.
- El contenido tiene prioridad sobre el chrome de interfaz.

### Densidad
- Densidad media-baja.
- Nunca compactar como backoffice.
- Nunca abrir huecos enormes solo para “lujo visual”.
- La UI respira, pero mantiene continuidad narrativa.

### Ritmo
- El ritmo se consigue con `space-y`, `gap`, divisores y bloques respirados.
- Se evita separar todo con cajas independientes.
- El sistema favorece secuencias de lectura:
  - contexto
  - accion principal
  - contenido
  - acciones secundarias

### Sensacion
- Campus integrado.
- Comunidad como continuacion del aprendizaje.
- Herramientas docentes visibles, pero no dominantes para alumnado.
- UI silenciosa, con friccion cognitiva baja.

### Principios UX
- Leer primero.
- Escribir despues.
- Moderar en segundo plano.
- Contexto visible sin sobreexplicacion.
- Accion primaria clara, sin competir con demasiadas secundarias.

### Comportamiento editorial
- Los titulos y bloques introductorios usan `font-premium`.
- Las descripciones son cortas, de tono sereno y line-height amplio.
- La metadata existe, pero se subordina visualmente al contenido.

### Jerarquia cognitiva
1. Titulo y contexto de seccion.
2. Contenido de conversacion.
3. CTA principal.
4. Metadata y estados.
5. Acciones secundarias y moderacion.

## 2. Sistema de spacing

### Contenedores globales
- `.site-container`
  - `max-width: 1280px`
  - `padding-inline: 1.5rem`
  - `padding-inline: 2rem` a partir de `1024px`
- Comunidad usa este contenedor como regla base. No crear wrappers adicionales salvo que el layout lo exija.

### Rhythm vertical de pagina
- Home y categoria:
  - `space-y-6`
  - `lg:space-y-8`
- Hilo:
  - `space-y-5`
  - `lg:space-y-6`
- Nuevo hilo:
  - `space-y-8`

### Spacing entre secciones
- Breadcrumbs a hero: 24px a 32px visuales.
- Hero a metricas o filtros: `mt-5`.
- Bloques internos nuevos suelen arrancar con:
  - `mt-4`
  - `mt-5`
  - `mt-6`
- Cuando hay cambio de tema dentro de una misma superficie:
  - `border-t`
  - `pt-4` o `pt-5`
  - evitar una segunda card.

### Spacing dentro de cards
- `SurfaceCard`:
  - `padding="md"` -> `p-5 lg:p-6`
  - `padding="lg"` -> `p-6 lg:p-7`
- Listas de hilos o respuestas:
  - filas con `px-5 py-4`
  - en `sm`: `px-6 py-5`
- `SectionHeader` usa `gap-4`.
- `FormField` usa `space-y-2`.

### Gaps recurrentes reales
- Microgrupos: `gap-2`
- Chips, badges, acciones pequenas: `gap-2` o `gap-3`
- Toolbars y acciones principales: `gap-3`
- Distribuciones principales: `gap-4` a `gap-6`

### Responsive spacing
- En movil, el contenido debe llegar antes que rails o bloques contextuales.
- En desktop, el sistema acepta mas aire, pero sin heroes inflados.
- En hilo, responder y leer deben sentirse contiguos, no separados por vacios grandes.

## 3. Sistema tipografico

### Familias
- Sans base:
  - `--font-sans`
  - `Manrope` como base actual
- Sans premium:
  - `--font-sans-premium`
  - `Plus Jakarta Sans`
- Mono para datos:
  - `--font-mono-data`
  - `JetBrains Mono`

### Jerarquias reales
- `text-display-lg`
  - `clamp(1.85rem, 3.2vw, 2.5rem)`
  - `line-height: 1.08`
  - `letter-spacing: -0.04em`
- `text-display-md`
  - `clamp(1.35rem, 2.2vw, 1.75rem)`
  - `line-height: 1.15`
  - `letter-spacing: -0.03em`
- `text-heading-md`
  - `clamp(1.15rem, 1.5vw, 1.35rem)`
  - `line-height: 1.25`
  - `letter-spacing: -0.02em`
- `text-body-sm`
  - `0.9375rem`
  - `line-height: 1.6`
- `text-body-md`
  - `1rem`
  - `line-height: 1.7`
- `text-label-sm`
  - `0.8125rem`
  - `line-height: 1.25`
  - `letter-spacing: 0.01em`
- `text-meta-xs`
  - `0.75rem`
  - `line-height: 1.4`
  - `letter-spacing: 0.08em`
  - `uppercase`

### Reglas de uso
- Titulos principales:
  - `font-premium`
  - `font-semibold`
  - tracking negativo
- Titulos de categoria y de hilo:
  - `font-premium`
  - `text-[1.24rem]` a `text-[1.5rem]`
  - `tracking-[-0.04em]`
- Cuerpo principal:
  - `text-sm` o `text-base`
  - `leading-7` o `leading-8`
- Hilo principal:
  - `text-base sm:text-lg`
  - `leading-8 sm:leading-9`
- Metadata:
  - `text-sm`
  - `text-[var(--color-muted)]`
- Labels de formulario:
  - `text-sm`
  - `font-medium`
- Eyebrows:
  - `text-meta-xs`
  - color de marca

### Peso visual de textos secundarios
- Secundario real en Comunidad V2:
  - `color: var(--color-muted)` o `var(--color-ink-soft)`
  - nunca negro
  - nunca tan prominente como el titulo o el cuerpo
- Timestamps, estados y contadores:
  - visibles
  - pequeños
  - subordinados

## 4. Sistema de superficies

### Superficie base
- `SurfaceCard` es la unidad principal.
- Base visual:
  - borde sutil
  - radio grande
  - fondo casi blanco
  - sombra suave

### Cuándo usar card
- Para secciones claramente delimitadas:
  - hero contextual
  - listas de hilos
  - formulario principal
  - bloque de moderacion
  - banners de soporte o estado

### Cuándo evitar nested surfaces
- No encapsular contenido dentro de una segunda card si basta:
  - `border-t`
  - `pt-4` o `pt-5`
  - `divide-y`
  - cambio de tipografia o fondo minimo
- En hilo, la solucion correcta ya usada es:
  - una sola `SurfaceCard`
  - cuerpo separado por divisor
  - no otra caja interna

### Variantes reales
- `default`
  - base general
- `muted`
  - fondo mas apagado
  - sin sombra
  - para bloques secundarios
- `interactive`
  - hover de `translateY(-1px)`
  - borde algo mas fuerte
  - `shadow-medium`

### Elevacion
- `--shadow-soft`
  - elevacion base
- `--shadow-medium`
  - solo para interactivos relevantes
- `--shadow-overlay`
  - reservado a overlays reales

### Borders
- Siempre sutiles.
- Reales en comunidad:
  - `rgba(22,60,88,0.08)` a `0.12`
- No usar bordes oscuros o demasiado definidos salvo casos funcionales.

### Radius
- `--radius-sm: 0.75rem`
- `--radius-md: 1rem`
- `--radius-lg: 1.5rem`
- `--radius-xl: 2rem`
- `--radius-pill: 9999px`

### Composicion
- Una superficie principal por bloque semantico.
- Dentro:
  - header
  - contenido
  - acciones
  - separadas por whitespace y divisores
- No construir “card + card + card” dentro del mismo contexto si se puede resolver con layout.

## 5. Sistema de acciones

### Variantes reales
- `primary`
  - gradiente vertical de marca
  - texto claro
  - sombra suave
  - hover con ligera subida
- `neutral`
  - borde
  - fondo claro
  - para accion secundaria importante
- `subtle`
  - casi texto enriquecido
  - para editar, reportar, volver, cancelar
- `highlight`
  - existe en sistema, no es protagonista en Comunidad V2
- `danger`
  - para operaciones destructivas puntuales

### Densidad
- `sm`
  - `min-h-10`
- `md`
  - `min-h: 3rem`
- `lg`
  - `min-h: 3.25rem`
- Comunidad V2 usa mayoritariamente `md`.
- Composer y CTA principales pueden escalar a apariencia `lg` con padding adicional por clase.

### Reglas de uso
- Solo una accion primaria dominante por bloque.
- Las acciones secundarias deben ir:
  - como `neutral`
  - o como `subtle`
- Acciones inline en hilo:
  - `variant="subtle"`
  - `px-0`
  - texto mas discreto

### Hover y focus
- Hover:
  - pequeno `translateY(-1px)` solo en acciones relevantes
- Focus:
  - `ring-2`
  - `ring-offset-2`
  - color de marca
- Disabled:
  - baja opacidad
  - sin interaccion

### Regla operativa
- Si un boton empieza a parecer “tarjeta flotante”, bajar sombra antes que tocar color.

## 6. Sistema de badges y chips

### Funcion
- Estado contextual rapido.
- Rol.
- Estado del hilo.
- Filtro activo.
- Edicion activa o marcador contextual.

### Regla de uso
- Usar badges para contexto corto, no para decorar.
- Maximo recomendado en un cluster visible:
  - 3 a 5, salvo vista de hilo con estados reales necesarios.

### Peso visual real
- `font-medium`
- tamaños pequenos
- fondos suaves
- sin contorno agresivo salvo `outline`

### Tonos reales
- `info`
  - docencia / rol docente
- `warning`
  - alumnado / estados de atencion suave
- `success`
  - resuelto
- `brand`
  - anuncio o contexto de marca
- `outline`
  - estado neutral o contextual
- `neutral`
  - apoyo sin protagonismo

### Cuándo evitar
- No usar un badge cuando un texto simple basta.
- No repetir badge + texto + estado con el mismo significado.
- No convertir contadores en chips si pueden vivir como texto auxiliar.

## 7. Layout rules

### Shell general
- Header sticky superior.
- Desktop:
  - grid `14.75rem minmax(0,1fr)`
  - rail izquierdo ligero
  - contenido principal dominante
- Mobile:
  - contenido primero
  - rail contextual desplazado hacia abajo

### Sidebar behavior
- Sidebar solo en `lg`.
- `sticky top-[7.4rem]`
- Debe acompañar, no competir.
- Menos padding y menos paneles que el contenido principal.

### Content width
- El contenido se apoya en `site-container`.
- El hilo y el composer no usan anchuras extremas; se limitan por la propia grid y por `max-w` locales en descripcion.

### Grid rhythm
- Home:
  - categorias `md:grid-cols-2`
  - `xl:grid-cols-3`
- Categoria:
  - metricas `sm:grid-cols-2`
  - `xl:grid-cols-5`
- Composer:
  - `xl:grid-cols-[minmax(0,1fr)_19.5rem]`

### Responsive collapse
- No esconder contenido principal por un rail.
- Lo contextual baja de prioridad en movil.
- Para filtros horizontales:
  - `overflow-x-auto`
  - `w-max min-w-full`
  - nunca romper viewport

### Sticky behavior
- Header sticky global del foro.
- Sidebar sticky en desktop.
- Composer sidebar sticky en `xl`.
- Evitar varios sticky grandes compitiendo en la misma altura.

## 8. Formularios

### Tono visual
- Formularios de comunidad no deben parecer panel de administracion.
- Se sienten como escritura contextual dentro del curso.
- Fondo claro, bordes suaves, mucho aire.

### Composicion
- `FormField` con:
  - label breve
  - descripcion serena
  - control
- Estructura habitual:
  - identidad de seccion con `SectionHeader`
  - campos principales
  - divisor
  - adjuntos
  - estado
  - submit

### Spacing
- Form principal:
  - `space-y-5` o `space-y-6`
- Agrupaciones:
  - `grid gap-4`
- Secciones internas:
  - `mt-5`
  - `border-t`
  - `pt-5`

### Controles
- `Input`
  - altura `3rem` o `3.25rem`
  - fondo casi blanco
  - borde suave
- `Textarea`
  - `min-h-28` o `min-h-32`
  - en composer principal puede crecer a `min-h-[18rem]`
- `select`
  - reutiliza `ui-control-base`

### Hints
- Los textos de ayuda usan `text-sm leading-6 text-[var(--color-muted)]`.
- Nunca deben competir con el contenido editable.

### Attachments
- Van como bloque secundario, nunca primero.
- Separados por divisor.
- Input file con estilo discreto:
  - chip de archivo integrado
  - no parecer upload widget externo

### Submit hierarchy
- Un solo submit primario.
- Cancelar o volver:
  - `subtle`
  - o `neutral` segun relevancia
- Errores:
  - `StateBanner tone="danger"`

## 9. Responsive philosophy

### 390
- Contenido primero.
- Chips y categorias pueden envolver o scrollear internamente.
- No mostrar rails completos antes del contenido.
- CTA principal siempre visible y legible.

### 768
- Mantener estructura lineal, pero permitir mejores grids.
- Las secciones empiezan a respirar mas.
- Formularios pueden usar dos columnas si el contenido lo tolera.

### 1024
- Entrada en layout de desktop.
- Aparece sidebar.
- Mas aire lateral, sin inflar heroes.

### 1280
- Maximo confort visual.
- El contenido sigue dominando.
- Sidebar y paneles de apoyo no deben ganar protagonismo solo por disponer de mas ancho.

## 10. Anti-patterns

### No volver a hacer
- Nested surfaces innecesarias.
- Cards dentro de cards para resolver separacion.
- Sombras fuertes en superficies normales.
- Exceso de badges simultaneos.
- Heroes demasiado altos para una vista de trabajo.
- Metadata con el mismo peso que el contenido principal.
- Grids tan rigidos que parezcan dashboard.
- Sidebar con demasiada presencia visual.
- Formularios con aspecto de backoffice duro.
- Filtros que rompan viewport en movil.
- Acciones secundarias tratadas como primarias.
- UI framework visible por exceso de bordes, pills y encapsulado.

## 11. Component inventory real de Comunidad V2

### Primitives UI usadas
- `Button`
- `ButtonLink`
- `SubmitButton`
- `ConfirmSubmitButton`
- `SurfaceCard`
- `Card`
- `Badge`
- `SectionHeader`
- `StateBanner`
- `EmptyState`
- `MetricPanel`
- `FormField`
- `Input`
- `Textarea`

### Componentes de foro usados
- `ForumShell`
- `ForumThreadComposer`
- `ThreadCreateForm`
- `ThreadReplyForm`

### Patrones reales observados
- breadcrumb editorial
- hero contextual en `SurfaceCard`
- fila de metricas suaves
- lista continua con `divide-y`
- banner de estado contextual
- composer con columna principal + rail de ajustes
- metadata inline y discreta
- acciones de moderacion segregadas

## 12. Recomendaciones para futuras paginas

### Dashboard alumno
- Extender el ritmo editorial de Comunidad V2.
- Priorizar continuidad de aprendizaje.
- Usar `SurfaceCard` solo para bloques claros.
- Evitar mosaicos de stats pesadas.

### Docente
- Mantener accesos operativos, pero con el mismo principio:
  - contenido principal primero
  - moderacion y gestion como capas secundarias

### Mis cursos
- Aplicar la misma jerarquia:
  - continuar
  - contexto
  - biblioteca
- Menos catalogo, mas continuidad narrativa.

### Recursos
- Organizar por listas, divisores y contexto.
- Evitar cajas independientes por cada microbloque.

### Checkout
- Reutilizar:
  - tipografia
  - spacing
  - surfaces
  - botones
- Pero reducir todavia mas el ruido auxiliar.

### Onboarding
- Aprovechar `SectionHeader`, `StateBanner`, `SurfaceCard` y `FormField`.
- Mantener tono humano y no administrativo.

### Admin
- Reutilizar tokens, tipografia, botones y controles.
- No trasladar literalmente la densidad de Comunidad V2:
  - admin puede ser mas denso
  - pero no mas duro

## Reglas de extension
- Si una nueva pagina necesita otra caja interna, primero probar:
  - `space-y`
  - `border-t`
  - `divide-y`
  - `SectionHeader`
- Si una accion nueva compite con la primaria, convertirla en `subtle` o `neutral`.
- Si la metadata empieza a dominar, moverla a:
  - una sola linea
  - color muted
  - tamano pequeno
- Si el layout en mobile duda entre rail y contenido, gana siempre el contenido.

## Criterio de conformidad
Una nueva pantalla respeta Comunidad V2 cuando:
- se siente parte del mismo campus
- deja que el contenido mande
- usa surfaces con moderacion
- no muestra nested cards evitables
- mantiene ritmo vertical controlado
- no rompe viewport
- no se apoya en badges y sombras para crear jerarquia
- mantiene calma, continuidad y legibilidad
