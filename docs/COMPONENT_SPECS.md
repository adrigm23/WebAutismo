# Component Specs

## Objetivo
Documentar los componentes core del sistema tal y como existen hoy. Este documento sirve para diseño, implementación y revisión.

## 1. Button / ButtonLink

### Propósito
- Acciones primarias, secundarias y textuales enriquecidas.

### Anatomía
- contenedor interactivo
- label
- icono opcional
- estados `hover`, `focus-visible`, `active`, `disabled`

### Variantes
- `primary`
- `neutral`
- `subtle`
- `highlight`
- `danger`
- aliases legacy:
  - `secondary` -> `neutral`
  - `ghost` -> `subtle`
  - `accent` -> `highlight`

### Tamaños
- `sm`
- `md`
- `lg`
- `icon`

### Spacing real
- `md`: `px-4 py-2.5`
- `lg`: `px-5 py-2.5`

### Accesibilidad
- focus visible obligatorio
- `disabled` real
- no depender solo de color para estado

### Cuándo usar
- `primary`: CTA principal del bloque
- `neutral`: secundaria importante
- `subtle`: inline actions, back links, edit/report/cancel

### Cuándo evitar
- varias `primary` juntas
- usar `primary` para acciones de soporte
- usar `danger` sin riesgo real

## 2. SurfaceCard

### Propósito
- Superficie principal para agrupar contenido relacionado.

### Anatomía
- container
- header opcional
- body
- actions opcionales

### Variantes
- `default`
- `muted`
- `interactive`

### Padding
- `md` -> `p-5 lg:p-6`
- `lg` -> `p-6 lg:p-7`

### Accesibilidad
- no usar como pseudo-botón si no es interactiva
- si es interactiva, el affordance debe ser claro

### Cuándo usar
- heroes contextuales
- paneles de contenido
- formularios
- listas complejas

### Cuándo evitar
- nested surfaces innecesarias
- microbloques que se resuelven mejor con divider + spacing

## 3. Badge

### Propósito
- Estado corto o contexto compacto.

### Anatomía
- pill/rounded container
- label
- icono opcional

### Tonos
- `neutral`
- `outline`
- `info`
- `success`
- `warning`
- `danger`
- `brand`

### Tamaños
- `sm`
- `md`

### Accesibilidad
- el significado no debe depender solo del color
- acompañar estados críticos con texto claro

### Cuándo usar
- rol
- estado de hilo
- contexto de edición
- estado resumido de entidad

### Cuándo evitar
- decoración
- repetir información ya visible en texto

## 4. FormField

### Propósito
- Contenedor semántico para label, control, hint y error.

### Anatomía
- label
- required marker opcional
- actions opcionales
- control
- error o description

### Spacing
- `space-y-2`

### Accesibilidad
- `htmlFor`
- `required`
- error con `role="alert"`

### Cuándo usar
- cualquier campo individual o bloque de control

### Cuándo evitar
- composiciones sin label donde la comprensión dependa solo del placeholder

## 5. Input

### Propósito
- Entrada de una línea.

### Tamaños
- `controlSize="md"`
- `controlSize="lg"`

### Base
- `ui-control-base`

### Cuándo usar
- títulos
- filtros
- fechas
- file input con clases adicionales

### Cuándo evitar
- como contenedor visual de contenido estático

## 6. Textarea

### Propósito
- Escritura contextual o descriptiva.

### Tamaños
- `md`
- `lg`

### Reglas
- mantener line-height cómodo
- no hacerla parecer una caja administrativa rígida

### Cuándo usar
- body de hilo
- respuesta
- notas
- enlaces multilinea

## 7. SectionHeader

### Propósito
- Encabezado editorial reutilizable para bloques y secciones.

### Anatomía
- eyebrow opcional
- title
- description opcional
- actions opcionales

### Variantes
- `size="lg"`
- `size="md"`
- `align="left"`
- `align="center"`

### Spacing
- gap base `4`
- `title` con `mt-3` si hay eyebrow
- `description` con `mt-3`

### Cuándo usar
- apertura de sección
- hero de bloque
- formulario principal

### Cuándo evitar
- microbloques donde un simple título basta

## 8. StateBanner

### Propósito
- Mensajes contextuales persistentes y claros.

### Tonos
- `info`
- `success`
- `warning`
- `danger`

### Anatomía
- icono opcional
- title opcional
- description
- actions opcionales

### Spacing
- `px-5 py-4`

### Cuándo usar
- error contextual
- warning de acceso o estado
- confirmación de bloque
- paginación informativa

### Cuándo evitar
- mensajes triviales
- como sustituto de un empty state

## 9. MetricPanel

### Propósito
- Métricas de lectura rápida dentro de un contexto premium, no de dashboard pesado.

### Tonos
- `default`
- `brand`
- `success`
- `warning`

### Anatomía
- label
- value
- detail opcional
- icon/actions opcionales

### Cuándo usar
- resumen de curso
- métricas introductorias
- cifras de estado

### Cuándo evitar
- grids masivos de KPIs
- métricas que no requieren foco

## 10. EmptyState

### Propósito
- Resolver ausencia de contenido o resultados.

### Variantes
- `tone="default"`
- `tone="subtle"`
- `align="left"`
- `align="center"`

### Anatomía
- icono opcional
- title
- description
- action opcional

### Cuándo usar
- listas vacías
- búsquedas sin resultados
- primera vez

### Cuándo evitar
- errores técnicos

## 11. Skeleton

### Propósito
- Placeholder de carga estructural.

### Variantes
- `rounded="sm" | "md" | "lg" | "pill" | "full"`
- `shimmer`

### Cuándo usar
- tablas
- cards
- métricas
- texto

### Cuándo evitar
- cargas instantáneas
- cargas que necesitan explicación, no forma

## 12. DataTable

### Propósito
- Tabla responsive base para vistas de datos reales.

### Anatomía
- `DataTable`
- `DataTableHeader`
- `DataTableBody`
- `DataTableRow`
- `DataTableHead`
- `DataTableCell`
- `DataTableEmpty`

### Reglas
- wrapper con `overflow-x-auto`
- headers con `text-meta-xs`
- filas con hover muy ligero

### Cuándo usar
- admin
- seguimiento
- listados tabulares reales

### Cuándo evitar
- listas cortas más editoriales donde `ListRow` o `SurfaceCard` funciona mejor

## 13. ListRow

### Propósito
- Fila compacta de contenido estructurado.

### Anatomía
- leading opcional
- eyebrow opcional
- title
- description
- trailing opcional

### Variantes
- `emphasis="default"`
- `emphasis="muted"`

### Cuándo usar
- actividad reciente
- checklist contextual
- preferencias
- elementos compactos con metadata

### Cuándo evitar
- contenido largo o narrativo

## 14. Tabs

### Propósito
- Navegación segmentada y ligera.

### Anatomía
- `Tabs`
- `TabsList`
- `TabsTrigger`
- `TabsPanel`

### Comportamiento
- pill group
- selected con fondo elevado
- no subrayado duro

### Cuándo usar
- cambio de subcontexto dentro de una misma pantalla

### Cuándo evitar
- navegación principal de aplicación si ya existe shell/topbar/sidebar
