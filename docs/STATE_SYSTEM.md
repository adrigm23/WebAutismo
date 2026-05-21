# State System

## Objetivo
Definir una matriz global de estados para el producto usando los componentes y tonos ya existentes. El objetivo es evitar que cada pantalla resuelva loading, error o vacío con una solución distinta.

## Regla general
- Un estado no es decoración.
- El estado debe estar lo más cerca posible del problema o del contenido afectado.
- Priorizar continuidad y legibilidad sobre dramatismo.

## Matriz de estados

| Estado | Cuándo usar | Componente recomendado | Tono visual | CTA recomendado | Evitar |
|---|---|---|---|---|---|
| `loading` | la estructura existe pero el contenido aún no | `Skeleton` | neutro | ninguno o cancelar si aplica | spinner gigante centrado para todo |
| `empty` | no hay datos todavía | `EmptyState` | default o subtle | crear, añadir, empezar | tratarlo como error |
| `no results` | filtros o búsqueda sin coincidencias | `EmptyState` | subtle | limpiar filtros, cambiar búsqueda | vaciar la pantalla sin explicación |
| `partial data` | parte del bloque cargó y parte no | contenido + `StateBanner` | info o warning | reintentar subbloque | bloquear todo el contexto |
| `syncing` | guardado o refresco silencioso en curso | texto inline o `StateBanner` pequeño | info | ninguno | spinner dominante |
| `disconnected` | el cliente perdió conexión o no puede sincronizar | `StateBanner` | warning | reintentar, reconectar | tratarlo como fatal si el contenido sigue visible |
| `error` | fallo contextual del bloque o formulario | `StateBanner` | danger | reintentar o corregir | toast aislado sin contexto |
| `retry` | error temporal recuperable | `StateBanner` + `Button neutral` | danger o warning | reintentar | retry sin causa ni contexto |
| `forbidden` | el usuario no puede realizar o ver algo | `StateBanner` o empty bloqueado | warning | volver, contactar, ir a zona permitida | mostrar controles activos que fallan después |
| `archived` | el contenido existe pero está fuera del flujo activo | `Badge outline`, `StateBanner` o bloque contextual | neutral o warning | ver histórico, restaurar si procede | mezclarlo con contenido activo sin marcarlo |
| `draft` | contenido no publicado o aún editable | `Badge outline` o `Badge neutral` | neutral | editar, publicar | usar color de error |
| `processing` | una acción tarda más que un submit normal | `SubmitButton` pending o `StateBanner` | info | esperar o cancelar | duplicar loading en varios sitios |
| `uploading` | subida de archivo o recurso | fila con progreso + texto | info | cancelar, cerrar | no mostrar progreso |
| `moderation pending` | contenido en espera de revisión | `Badge warning` o `StateBanner warning` | warning | ver estado, esperar | tono de error duro |
| `blocked` | la acción no puede continuar por una condición dura | `StateBanner danger` | danger | corregir requisito | dejar CTA activo |
| `disabled` | opción visible pero no disponible | control disabled | muted | helper opcional | ocultar sin explicación si afecta comprensión |
| `success transient` | confirmación breve tras acción correcta | texto inline, toast discreto o `StateBanner success` | success | opcional | usar modal de confirmación |

## Reglas por tipo de estado

### 1. Estados de contenido
- `loading`
- `empty`
- `no results`
- `partial data`

Resolver con estructura visible y calma. No dejar al usuario “sin marco”.

### 2. Estados de interacción
- `processing`
- `uploading`
- `syncing`
- `autosave`
- `success transient`

Resolver con feedback breve y cercano a la acción.

### 3. Estados de restricción
- `forbidden`
- `blocked`
- `disabled`
- `archived`
- `draft`
- `moderation pending`

Resolver con tono contextual, no con dramatismo innecesario.

### 4. Estados de fallo
- `error`
- `retry`
- `disconnected`

Resolver con:
1. causa o síntoma útil
2. siguiente paso
3. CTA claro si procede

## Qué componente usar primero

### `Skeleton`
- cuando la estructura es conocida
- para listas, tablas, cards, métricas

### `EmptyState`
- cuando no hay contenido real o no hay resultados

### `StateBanner`
- cuando hay mensaje contextual persistente
- especialmente:
  - warning
  - error
  - info contextual
  - success breve de bloque

### `Badge`
- para estados cortos dentro de una fila o entidad
- no para explicar escenarios complejos

### Inline text
- para metadata y feedback pequeño:
  - guardando
  - sincronizado
  - última actualización

## Qué evitar
- dos componentes de estado para el mismo problema
- usar `danger` para estados informativos
- usar `success` para datos meramente estáticos
- usar empty state cuando en realidad hay error de carga
- mostrar CTA de retry si la causa es permisos
