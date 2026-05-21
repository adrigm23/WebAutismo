# Visual QA Audit

## Objetivo
Recoger la deuda visual detectada tras Comunidad V2 y Fase 2 alumno para que la expansión del producto no reintroduzca inconsistencia. Este documento no prescribe un rediseño: lista dónde hay desviaciones reales y qué severidad tienen.

## 1. Hallazgos principales

### 1.1 Tokens y color
- El núcleo v2 ya es consistente en `forum` y `ui`.
- La deuda está sobre todo en `learning` y dashboards:
  - azules legacy
  - hex directos de estados
  - superficies resueltas inline

### 1.2 Spacing
- Comunidad V2 tiene buen ritmo.
- En `learning` y algunos dashboards aún hay spacing más irregular:
  - grids con fracciones locales
  - paneles con padding no estandarizado
  - huecos más grandes de lo necesario en algunas composiciones hero/panel

### 1.3 Shadows
- Comunidad V2 usa sombra bien controlada.
- Fuera de ese núcleo aún hay varias sombras directas y mezcladas.

### 1.4 Radius
- El sistema oficial ya existe.
- La deuda real es la mezcla con:
  - `rounded-2xl`
  - `18px`
  - `20px`
  - radios hardcoded en componentes de soporte

### 1.5 Badges
- En Comunidad V2 ya están bien encaminados.
- Aún hay badges legacy y pills con tratamiento diferente en otras áreas.

### 1.6 Botones
- El core `Button` ya está consolidado.
- Persisten botones manuales con clases inline en partes del producto.

### 1.7 Surfaces
- Comunidad V2 redujo nested surfaces de forma correcta.
- `learning` y algunos dashboards siguen teniendo más encapsulado del ideal.

### 1.8 Headings y metadata
- Comunidad V2 ya bajó bien el peso visual secundario.
- Otras áreas aún muestran metadata demasiado presente o headings menos editoriales.

### 1.9 Forms
- Los formularios v2 del foro ya son una base correcta.
- Algunos formularios legacy siguen con tono más administrativo.

### 1.10 Sticky headers y sidebars
- Foro y campus ya están razonablemente bien.
- Persisten offsets manuales que todavía no forman parte de una escala declarada.

## 2. Severidad

### Alta
- Colores directos legacy fuera del núcleo v2.
- Estados resueltos con hex en vez de semántica.
- Inline buttons fuera de primitives.

### Media
- Radios y sombras no unificados.
- Anchuras y offsets repetidos sin token.
- Nested surfaces en `learning`.

### Baja
- Ajustes finos de spacing entre pantallas.
- Algunas diferencias de hover o pills no críticas.

## 3. Zonas con mayor deuda visual

### `src/components/learning/**`
- mayor presencia de azul legacy
- más bordes y bloques secundarios
- más clases inline de estado

### `src/components/account/**`
- fondos y banners demo con hex directos
- varias composiciones aún híbridas entre v1 y v2

### `src/components/admin/**`
- menos crítico visualmente
- pero todavía no totalmente absorbido por el mismo lenguaje premium

## 4. Reglas para siguientes intervenciones
- No corregir deuda con otra capa de clases inline.
- Normalizar primero a través de:
  - token existente
  - primitive existente
  - layout helper existente
- Si una pantalla nueva necesita “algo especial”, documentarlo antes de multiplicarlo.

## 5. No rehacer todavía
- No abrir refactor transversal de `learning` completo dentro de esta fase.
- No rehacer dashboards solo para borrar hex.
- No tocar backend ni contratos funcionales.

## 6. Orden recomendado de limpieza futura
1. colores y estados semánticos
2. radios y sombras
3. botones manuales e inputs fuera de primitives
4. offsets y widths repetidos
5. nested surfaces restantes
