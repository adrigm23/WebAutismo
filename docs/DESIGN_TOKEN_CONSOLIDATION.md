# Design Token Consolidation

## Objetivo
Consolidar los tokens reales ya presentes en el producto para que la siguiente expansión visual reutilice una base estable y no siga introduciendo valores sueltos. Este documento no redefine la estética: normaliza lo que ya existe y señala deuda real.

## Alcance
- Basado en `src/app/globals.css` y en el uso actual dentro de `src/components/ui`, `src/components/forum`, `src/components/learning` y `src/components/account`.
- No introduce nuevas familias visuales.
- No modifica backend, negocio ni contratos de interacción.

## 1. Tokens base ya estables

### Tipografía
- `--font-sans`
- `--font-sans-premium`
- `--font-mono-data`

### Fondos y superficies
- `--color-bg-app`
- `--color-bg-subtle`
- `--color-surface`
- `--color-surface-elevated`
- `--color-surface-muted`

### Texto
- `--color-ink`
- `--color-ink-soft`
- `--color-ink-muted`
- alias actualmente usados:
  - `--color-muted`

### Bordes
- `--color-border`
- `--color-border-subtle`
- `--color-border-strong`
- alias actualmente usado:
  - `--surface-border-subtle`

### Marca y estados semánticos
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

### Alias heredados todavía activos
- `--color-primary`
- `--color-primary-strong`
- `--color-primary-soft`
- `--color-accent`
- `--color-accent-soft`
- `--color-secondary`
- `--color-teal`
- `--color-coral`
- `--color-gold`

### Sombras
- `--shadow-soft`
- `--shadow-medium`
- `--shadow-strong`
- `--shadow-overlay`
- `--shadow-inset-soft`

### Radius
- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`
- `--radius-surface`
- `--radius-pill`

### Alturas de control
- `--control-height-md`
- `--control-height-lg`

### Motion
- `--motion-duration-fast`
- `--motion-duration-base`
- `--motion-duration-slow`
- `--motion-ease-standard`

### Layout
- `--container-public`
- `--container-app`
- `--sidebar-width-admin`
- `--sidebar-width-community`
- `--topbar-height`
- `--z-header`
- `--z-overlay`
- `--focus-ring`

## 2. Utilidades globales ya consolidadas

### Tipografía utilitaria
- `.text-display-xl`
- `.text-display-sm`
- `.text-display-lg`
- `.text-display-md`
- `.text-heading-lg`
- `.text-heading-md`
- `.text-body-lg`
- `.text-body-md`
- `.text-body-sm`
- `.text-label-sm`
- `.text-meta-xs`

### Superficies y estados
- `.ui-card-base`
- `.ui-card-muted`
- `.ui-card-interactive`
- `.surface-card`
- `.ui-state-panel`
- `.ui-empty-state`
- `.ui-empty-state-subtle`

### Controles e interacción
- `.ui-control-base`
- `.ui-button`
- `.ui-inverse-text`
- `.ui-focus-ring`

### Layout
- `.site-container`
- `.app-container`
- `.campus-calm-bg`

## 3. Qué está realmente bien consolidado

### Comunidad V2
- Colores semánticos ya consistentes.
- Tipografía premium + sans base bien establecida.
- Botones con variantes claras.
- Form controls con una sola base.
- Radius y sombras ya bastante alineados.
- `SurfaceCard`, `SectionHeader`, `Badge`, `StateBanner` y `EmptyState` ya forman un núcleo de sistema.

### Student v2
- Reutiliza buena parte del sistema nuevo.
- Refuerza `MetricPanel`, `ListRow` y `SurfaceCard` como piezas extensibles.

## 4. Deuda real detectada

## 4.1 Colores sueltos

### Persisten valores legacy fuera del núcleo v2
- `rgba(12,113,195,...)` sigue apareciendo en varias zonas de `learning` y partes docentes.
- Hex directos siguen apareciendo en dashboards y estados:
  - `#fff1cf`
  - `#7c5300`
  - `#805c16`
  - `#fff1ec`
  - `#9b4128`
  - `#eff9f1`
  - `#1d6b35`
  - `#faf8f4`
  - `#f7f9fb`
  - `#101722`

### Lectura
- No rompen el producto hoy.
- Sí indican que el sistema premium aún convive con restos del sistema azul anterior y con estados definidos inline.

## 4.2 Shadows sueltas
- `button.tsx` usa sombras inline por variante.
- Varias vistas de `learning`, `forum-shell`, `teacher dashboard` y `resource preview` usan `shadow-[...]` directas.
- Algunas sombras están ya alineadas visualmente; el problema es de mantenibilidad, no necesariamente de estética.

## 4.3 Radius mezclado
- Conviven:
  - `rounded-[var(--radius-...)]`
  - `rounded-2xl`
  - `rounded-[18px]`
  - `rounded-[20px]`
  - `rounded-full`
- La base correcta del sistema ya existe, pero sigue habiendo radios arbitrarios fuera de primitives.

## 4.4 Layout tokens aún no absorbidos
- Hay anchos y offsets inline relevantes:
  - `14.75rem`
  - `19.5rem`
  - `22rem`
  - `7.4rem`
  - `74px`
- No todos deben subir a token global, pero los repetidos sí deberían consolidarse cuando se haga un siguiente refactor técnico.

## 4.5 Fondos y gradientes sueltos
- Existen gradientes válidos del lenguaje v2, pero definidos inline:
  - fondos de hero
  - fondos de metric panels
  - fondos de icon blocks
  - fondos de curso/preview
- Esto no requiere rediseño, pero sí clasificación futura entre:
  - surface tonal
  - brand tonal
  - warning tonal
  - media/hero tonal

## 5. Normalización recomendada sin cambiar estética

### A. Mantener como núcleo estable
- No tocar:
  - paleta semántica base
  - escala tipográfica
  - radius base
  - alturas de control
  - motion base
  - primitives v2

### B. Prioridad alta de normalización futura
- Sustituir direct colors en `learning` y dashboards por tokens ya existentes.
- Reemplazar radios arbitrarios por:
  - `--radius-sm`
  - `--radius-md`
  - `--radius-lg`
  - `--radius-xl`
- Sustituir sombras inline repetidas por combinaciones de:
  - `--shadow-soft`
  - `--shadow-medium`
  - `--shadow-inset-soft`

### C. Prioridad media
- Promover a tokens de layout los offsets repetidos si se repiten en más de una familia de páginas:
  - sticky top offset
  - sidebar width contextual
  - aside composer width
  - shell min-height offset

### D. Prioridad baja
- Consolidar gradientes de apoyo en aliases semánticos, pero solo después de cerrar la migración visual de páginas principales.

## 6. Regla operativa para nuevos cambios

Antes de introducir un valor nuevo, comprobar si ya existe un equivalente en:
- `globals.css`
- una primitive UI
- Comunidad V2

Si no existe, la decisión correcta no es meterlo inline por defecto. Hay que evaluar:
1. Si es una excepción local real.
2. Si debe vivir en una primitive.
3. Si merece subir a token global.

## 7. Qué no debe hacerse en siguientes fases
- Añadir más aliases de color sin motivo.
- Crear otro set de radius local.
- Introducir nuevos `shadow-[...]` por comodidad.
- Reintroducir azules legacy donde ya existe `--color-brand`.
- Resolver estados con hex directos si ya existe color semántico equivalente.
- Meter `rounded-2xl` o tamaños arbitrarios en nuevas pantallas cuando ya hay escala oficial.

## 8. Backlog técnico recomendado

### Fase 1
- Auditar `learning` para sustituir colores legacy directos por tokens existentes.
- Auditar dashboards de alumno/docente para eliminar hex de estados demo y banners.

### Fase 2
- Consolidar offsets y widths repetidos en shells.
- Reducir radios y sombras inline fuera de primitives.

### Fase 3
- Revisar gradientes decorativos restantes y clasificarlos por semántica real.

## 9. Criterio de consolidación
El sistema puede considerarse consolidado cuando:
- los colores principales se resuelven con tokens, no con hex inline
- los estados se resuelven con semántica, no con colores “a ojo”
- los radios y sombras vienen de escala conocida
- las primitives cubren el 80–90% de nuevas necesidades
- las páginas nuevas no necesitan inventar sus propios bloques base
