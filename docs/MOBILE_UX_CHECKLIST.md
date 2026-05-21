# Mobile UX Checklist

## Objetivo
Checklist operativa para revisar el producto en `390px` y `768px` antes de cerrar una vista.

## Breakpoints mínimos
- `390px`
- `768px`

## Reglas generales
- El contenido principal va antes que rails y paneles secundarios.
- No debe existir overflow horizontal global.
- Todo CTA importante debe ser tap-friendly.
- El foco visible debe seguir siendo perceptible incluso en móvil.

## 1. Safe area
- comprobar padding superior en dispositivos con notch
- comprobar separación inferior cerca de barras del sistema
- evitar CTA pegadas al borde inferior sin respiro

## 2. Keyboard behavior
- input enfocado sigue visible
- textarea no queda tapada por teclado
- submit sigue alcanzable
- no usar sticky que bloquee el campo activo

## 3. Sticky CTA
- usar solo si realmente mejora la tarea
- no debe tapar contenido
- debe respetar safe area inferior

## 4. Bottom spacing
- último bloque no debe terminar pegado al borde
- formularios largos necesitan aire final suficiente
- banners o footers no deben competir con CTA final

## 5. Composer móvil
- contenido primero
- contexto de apoyo después si hace falta
- textarea cómoda
- file input usable
- submit visible sin necesidad de scroll excesivo

## 6. Tablas móviles
- usar `overflow-x-auto` controlado
- no permitir clipping silencioso
- si la tabla deja de ser legible, considerar patrón alternativo en futura iteración

## 7. Filtros horizontales
- scroll interno permitido
- nunca romper viewport
- mantener foco visible
- no encadenar dos carruseles horizontales seguidos

## 8. Navegación contextual
- sidebar desktop no debe aparecer antes que el contenido
- categorías, filtros y ayudas deben bajar de prioridad
- topbar debe seguir siendo clara sin ocupar demasiado alto

## 9. Overflow
- revisar:
  - chips
  - tablas
  - filenames largos
  - botones con icono + texto
  - breadcrumbs
  - formularios con grid

## 10. Focus visible
- enlaces
- tabs
- botones
- campos
- acciones inline

## 11. Touch targets
- mínimo práctico de 40px
- acciones pequeñas deben tener padding suficiente
- evitar icon buttons demasiado densos

## 12. Checklist 390px
- contenido principal visible sin rail previo
- hero no exagerado
- chips envuelven o scrollean internamente
- CTA principal visible y legible
- no hay clipping local
- file inputs y attachments siguen usables

## 13. Checklist 768px
- grid intermedio no introduce columnas demasiado estrechas
- side panels aún no roban protagonismo
- formularios de dos columnas siguen siendo legibles
- se mantiene la continuidad de lectura

## 14. Señales de fallo
- scroll horizontal de página
- chips cortados
- sticky que pisa contenido
- CTA fuera de viewport al enfocar teclado
- tablas ilegibles sin alternativa
- exceso de aire vertical que obliga a demasiado scroll
