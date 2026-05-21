# Interaction System

## Objetivo
Definir el comportamiento interactivo del producto sobre la base visual ya existente. Este documento no añade efectos nuevos: fija cómo deben sentirse hover, focus, loading y estados transitorios dentro del lenguaje premium calmado.

## Principios
- Interacción silenciosa.
- Confirmación clara, no ruidosa.
- Prioridad a accesibilidad cognitiva.
- Movimiento breve, con intención.
- Nada “flashy”, nada elástico, nada agresivo.

## 1. Hover

### Regla general
- Hover debe sugerir disponibilidad, no reclamar atención.
- El sistema actual usa:
  - leve cambio de fondo
  - leve refuerzo de borde
  - `translateY(-1px)` solo en elementos accionables relevantes

### Aplicación
- `Button primary/neutral`: puede elevarse `-1px`
- `SurfaceCard interactive`: puede elevarse `-1px`
- links textuales:
  - cambio de color a marca
  - sin subrayado exagerado

### Evitar
- escalados grandes
- blur adicional
- sombras duras
- cambios bruscos de saturación

## 2. Active / Pressed

### Regla
- La interacción pulsada debe sentirse táctil pero contenida.
- Base actual:
  - `active:scale-[0.985]` en botón

### Recomendación
- Mantener pressed solo en CTAs y toggles reales.
- No aplicar pressed a listas completas ni bloques informativos.

## 3. Focus

### Regla
- Focus visible siempre.
- Debe ser consistente entre botones, tabs, inputs y acciones navegables.

### Implementación real
- `ring-2`
- `ring-offset-2`
- color de marca
- en controles: `box-shadow: 0 0 0 2px var(--focus-ring)`

### Reglas
- Nunca eliminar focus ring por estética.
- En fondos muy claros, el ring debe seguir siendo visible.
- En enlaces tipo texto, si no hay ring, debe haber al menos cambio evidente de color o contorno.

## 4. Disabled

### Regla
- Disabled debe comunicar indisponibilidad, no desaparición.

### Tratamiento real
- menor opacidad
- `pointer-events: none`
- color y fondo más apagados en `ui-control-base`

### Evitar
- textos demasiado pálidos
- disabled indistinguible de secundario

## 5. Loading

### Regla
- El loading debe preservar estructura y reducir ansiedad.

### Patrón recomendado
- usar `Skeleton` cuando la estructura es conocida
- usar `StateBanner` o texto inline cuando la acción es breve
- no vaciar toda la pantalla si solo carga un fragmento

### Tono
- neutro
- silencioso
- sin spinners dominantes si no son imprescindibles

## 6. Skeleton

### Componente
- `Skeleton`

### Uso
- listas
- tablas
- paneles de métricas
- bloques de texto
- cards de carga

### Reglas
- imitar forma real del contenido
- mantener radius del sistema
- usar `animate-pulse` moderado

### Evitar
- esqueletos demasiado oscuros
- usar skeleton para cargas muy rápidas que generen parpadeo

## 7. Syncing

### Definición
- Estado de sincronización en segundo plano sin bloqueo total.

### Patrón recomendado
- texto auxiliar discreto
- badge o caption de estado
- `StateBanner tone="info"` solo si el mensaje requiere atención contextual

### Tono visual
- informativo
- nunca alarma salvo error

## 8. Autosave

### Definición
- Guardado automático no bloqueante.

### Patrón recomendado
- mensaje corto, no modal:
  - “Guardando…”
  - “Guardado”
  - “Autosaved just now”
- idealmente cerca del contexto editable, no como toast invasivo

### Regla
- no usar botón principal para representar autosave
- no competir con el contenido

## 9. Upload progress

### Definición
- Carga de archivos o recursos con avance visible.

### Patrón recomendado
- fila de recurso
- progreso lineal
- estado textual
- acción secundaria para cancelar o cerrar

### Jerarquía
1. nombre del archivo
2. progreso
3. acción

### Evitar
- overlays innecesarios
- loaders sin porcentaje o sin feedback de avance

## 10. Toast

### Situación actual
- No hay un sistema de toast global formalizado como primitive única del sistema.

### Recomendación de consolidación
- Hasta que exista una primitive oficial, usar solo para confirmaciones breves y no bloqueantes:
  - éxito puntual
  - subida completada
  - guardado completado

### Reglas
- breve
- una acción opcional como máximo
- no reemplaza errores complejos ni estados persistentes

## 11. Empty states

### Componente
- `EmptyState`

### Uso
- sin datos
- sin resultados
- primera vez
- lista vacía

### Reglas
- tono calmado
- icono opcional
- descripción útil
- CTA solo si realmente desbloquea la situación

## 12. Error states

### Componente base
- `StateBanner tone="danger"`

### Uso
- error de formulario
- error contextual de bloque
- fallo de sincronización
- fallo de carga recuperable

### Reglas
- el mensaje debe decir qué pasó y qué hacer ahora
- priorizar proximidad al problema
- no convertir cada error en pantalla completa

## 13. Retry

### Cuándo usar
- error temporal
- sincronización fallida
- carga remota fallida
- subida interrumpida

### CTA recomendado
- `Button neutral` si es una acción principal del bloque
- `Button subtle` si es secundaria

### Evitar
- retry sin explicación
- retry repetido si el error es de permisos o acceso

## 14. Optimistic UI

### Regla
- Usar solo cuando el usuario necesita continuidad inmediata.
- Debe sentirse estable, no “mágico”.

### Patrón recomendado
- mantener la fila o contenido visible
- marcar estado transitorio con texto sutil:
  - “Enviando…”
  - “Sincronizando…”

### Evitar
- reordenamientos bruscos
- desaparición y reaparición del contenido

## 15. Motion

### Base real del sistema
- `160ms`
- `200ms`
- `220ms`
- `cubic-bezier(0.22, 1, 0.36, 1)`

### Regla
- usar motion solo para:
  - hover
  - focus
  - elevación ligera
  - cambios de color o borde
  - revelado suave de overlays

### Evitar
- rebotes
- elasticidad
- transiciones largas
- motion decorativo sin función

## 16. Jerarquía de feedback
1. Inline helper o texto contextual.
2. `StateBanner` dentro del bloque.
3. Empty state si no hay contenido.
4. Toast solo para confirmación breve.

## 17. Qué no hacer
- spinners enormes en paneles pequeños
- CTA parpadeando
- colores agresivos para feedback normal
- duplicar mensaje de estado en banner + toast + badge
- usar animación para compensar falta de jerarquía visual
