# Design System v1

## Objetivo
Definir la base visual y de arquitectura UX/UI para que WebAutismo funcione como una sola plataforma e-learning, no como una suma de páginas independientes.

Este documento fija la base de Fase B. No redefine todavía pantallas completas ni introduce cambios de lógica, backend o dominio.

## Principios visuales
- Una sola plataforma, varios contextos: público, alumno, docente y admin deben sentirse relacionados aunque cada shell tenga distinta densidad.
- Calma operativa: interfaz clara, amable y estable. No usar recursos visuales agresivos ni estética SaaS genérica.
- Jerarquía antes que decoración: primero estructura, foco y orden; después polish.
- Información accionable: cada bloque debe responder una de estas preguntas: dónde estoy, qué sigue, qué requiere atención, cómo vuelvo.
- Profundidad contenida: usar superficie, borde y sombra con moderación. El relieve comunica jerarquía, no ornamentación.
- Consistencia semántica: un mismo color, badge o patrón debe significar lo mismo en todo el producto.

## Tono de producto
- Profesional y cercano.
- Especializado, no institucional pesado.
- Claro y directo.
- Premium sobrio, no “startup brillante”.
- Orientado a aprendizaje y seguimiento, no a panel administrativo genérico.

## Escala tipográfica
- `display-xl`: héroes públicos y mensajes principales de cuenta.
- `display-lg`: H1 de páginas principales.
- `display-md`: H2 de secciones relevantes.
- `text-body-lg`: introducciones y texto explicativo principal.
- `text-base` / `text-sm`: cuerpo general, tablas, formularios, ayuda.
- `text-xs`: labels secundarios, metadatos, overlines.

Reglas:
- Solo `display-*` para mensajes de alto nivel.
- Evitar tamaños arbitrarios por pantalla salvo excepciones justificadas de hero.
- Usar tracking negativo solo en display y números protagonistas.
- En dashboards, progreso y métricas: activar cifras tabulares.

## Escala de spacing
- Base: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- `12-16`: separación interna de controles.
- `20-24`: tarjetas compactas y celdas de panel.
- `32-40`: separación entre bloques de página.
- `48-64`: aperturas de hero o secciones principales.

Reglas:
- No mezclar densidades en el mismo bloque.
- Público: respiración amplia.
- Alumno/docente: densidad media.
- Admin: densidad media-alta, pero sin colapsar padding.

## Sistema de colores
### Núcleo
- `--color-background`: fondo general cálido.
- `--color-surface`: superficie secundaria.
- `--color-surface-strong`: blanco principal.
- `--color-ink`: texto principal.
- `--color-muted`: texto secundario.
- `--color-border`: borde estándar.
- `--color-primary`: azul de marca y acciones principales.
- `--color-primary-strong`: azul para hover/pressed.
- `--color-primary-soft`: azul suave para énfasis de baja intensidad.
- `--color-accent`: ámbar para momentos de compra o llamada destacada.
- `--color-accent-soft`: soporte del ámbar.
- `--color-success`: validación positiva.
- `--color-success-soft`: fondo suave de éxito.
- `--color-danger`: error o acción delicada.
- `--color-danger-soft`: fondo suave de error.

### Semántica
- Azul: navegación, foco, progreso, acciones principales.
- Ámbar: atención, compra, pendientes, avisos cálidos.
- Verde: estado correcto, aprobado, éxito.
- Rojo/naranja oscuro: error, bloqueo o riesgo.

Reglas:
- No introducir nuevos acentos por área.
- No mezclar azules de marca con azules arbitrarios en componentes nuevos.
- El fondo cálido debe mantenerse como pegamento visual entre shells.

## Radios permitidos
- `--radius-sm` = 12px: métricas compactas, badges cuadrados, inputs muy compactos.
- `--radius-md` = 16px: botones, inputs, textarea, pequeños panels.
- `--radius-lg` = 24px: cards principales y estados.
- `--radius-xl` = 32px: héroes o bloques destacados excepcionales.
- `--radius-pill`: chips, badges y navegación pill.

Reglas:
- Default de controles: `md`.
- Default de card: `lg`.
- `xl` solo para bloques protagonistas.
- Evitar nuevos `rounded-[NNpx]` sin motivo real.

## Sombras permitidas
- `--shadow-soft`: card base.
- `--shadow-medium`: card elevada o estado interactivo.
- `--shadow-strong`: destacados puntuales.
- `--shadow-inset-soft`: controles y superficies con sensación táctil sutil.

Reglas:
- No apilar varias sombras decorativas.
- El estado interactivo debe sentirse más nítido por borde y leve elevación, no por sombra exagerada.

## Variantes de cards
### Card base
Uso:
- contenedores principales
- bloques de dashboard
- formularios principales

### Card soft
Uso:
- apoyo contextual
- side panels
- métricas secundarias

### Card interactive
Uso:
- listas clicables
- tarjetas de acceso a curso
- filas con hover y acción primaria

### Empty/Error/Success panel
Uso:
- ausencia de contenido
- confirmaciones
- bloqueos recuperables

Reglas:
- Una card no necesita siempre borde, sombra y fondo especial a la vez.
- Si el bloque solo agrupa contenido sin jerarquía real, priorizar layout antes que card.

## Variantes de botones
### Canónicas v1
- `primary`: acción principal del bloque o pantalla.
- `neutral`: acción secundaria visible.
- `subtle`: acción terciaria, navegación contextual o apoyo.
- `highlight`: acción comercial o CTA destacada.

### Compatibilidad legacy
- `secondary` sigue funcionando y equivale a `neutral`.
- `ghost` sigue funcionando y equivale a `subtle`.
- `accent` sigue funcionando y equivale a `highlight`.

Reglas:
- Máximo un `primary` por bloque.
- `highlight` reservado a compra, activación o CTA muy claro.
- No convertir toda navegación en botones.

## Variantes de badges
### Canónicas v1
- `neutral`
- `outline`
- `info`
- `success`
- `warning`
- `danger`
- `brand`

### Compatibilidad legacy
- `default` -> `neutral`
- `muted` -> `outline`
- `teacher` -> `info`
- `student` -> `warning`
- `accent` -> `warning`

Reglas:
- Los badges deben expresar rol, estado o tipo, no decoración.
- No usar varios badges semánticamente redundantes en la misma línea.

## Formularios
### Controles base
- Inputs y textarea comparten `ui-control-base`.
- Altura estándar de control: `--control-height-md`.
- Radio estándar: `--radius-md`.

### Estructura
- label arriba
- helper debajo si hace falta
- error inline bajo el control
- CTA principal al final

### Estados
- default
- focus
- disabled
- error
- success informativo

Reglas:
- Evitar mensajes de error solo al final del formulario.
- No usar colores de error para hints neutrales.
- No mezclar estilos de input entre auth, admin y foro en nuevos desarrollos.

## Tabs
### Patrón base
- Tabs de contexto, no de navegación global.
- Deben vivir dentro de un shell o página, no sustituir la IA principal.

### Uso en WebAutismo
- Campus: `Contenido`, `Recursos y tareas`, `Comunidad`.
- Foro: filtros y vistas de categoría.
- Cuenta/docencia/admin: tabs solo cuando reducen salto entre subflujos.

Reglas:
- Máximo 3-5 tabs visibles.
- La tab activa debe ser evidente por relleno o borde.
- Si el usuario necesita comparar áreas muy distintas, usar navegación, no tabs.

## Estados loading / empty / error / success
### Loading
- Usar skeletons con la misma forma del contenido final.
- Evitar spinners aislados como patrón principal.

### Empty
- Explicar por qué está vacío.
- Indicar siguiente acción.
- Mantener el tono útil, no dramático.

### Error
- Mensaje directo.
- Acción de recuperación si existe.
- Separar fallo técnico de falta de permisos o ausencia de datos.

### Success
- Confirmar resultado.
- Decir qué ocurre después.
- No abusar de banners de éxito permanentes.

## Navegación por rol
### Pública
- `Inicio`
- `Cómo funciona`
- `Cursos`
- `Registro`
- `Acceder`

### Alumno
- `Mi cuenta` como overview personal y preferencias.
- `Mis cursos` como índice de accesos.
- Dentro del curso: `Campus`, `Recursos y tareas`, `Comunidad`.

### Docente
- `Panel docente` como hub.
- `Mis cursos`
- `Seguimiento`
- `Comunidad`
- `Recursos`
- `Preferencias`

### Admin
- `Dashboard`
- `Usuarios`
- `Docentes`
- `Cursos`
- `Ediciones`
- `Promociones`
- `Auditoría`
- `Supervisión`

### Móvil
- Reducir a navegación prioritaria por rol.
- No reproducir en móvil toda la densidad del escritorio.
- Mantener acceso directo a “volver”, “continuar” y “pendientes”.

## Relación entre Mi cuenta, Mis cursos, Campus, Foro y Seguimiento
- `Mi cuenta`: overview de persona, actividad reciente, preferencias y notificaciones.
- `Mis cursos`: índice de cursos y puertas de entrada.
- `Campus`: espacio principal de aprendizaje o de trabajo sobre un curso.
- `Foro`: extensión comunitaria del curso, no shell paralelo dominante.
- `Seguimiento`: espacio docente para revisar progreso, entregas y estados del alumnado.

Regla operativa:
- El alumno entra a `Mi cuenta` o `Mis cursos` y aterriza en `Campus`.
- El docente entra a `Panel docente` y aterriza en `Seguimiento` o en un curso concreto.
- `Foro` nunca debe competir con `Campus` como punto de entrada principal.

## Cuándo usar cada patrón
### Card base
Cuando el bloque necesita jerarquía y separación clara.

### List row / interactive card
Cuando el objetivo es navegar o abrir detalle.

### Badge
Cuando hay que resumir estado, rol o clasificación en una sola palabra o pareja breve.

### Button primary
Cuando hay una acción principal inequívoca.

### Button neutral
Cuando hay una acción secundaria visible pero relevante.

### Button subtle
Cuando la acción es contextual, de navegación o de baja prioridad.

### Empty state
Cuando la ausencia de contenido deja al usuario sin siguiente paso.

### Tab
Cuando el usuario permanece en el mismo contexto de trabajo y cambia de panel.

### Shell lateral
Solo en contextos con navegación estable y profundidad suficiente: docente/admin/foro.

## Decisiones de Fase B
- Mantener la paleta y la tipografía actuales.
- Consolidar semántica de radios, sombras y controles.
- Introducir nombres canónicos para botones y badges sin romper usos existentes.
- Documentar la arquitectura de navegación antes de tocar páginas grandes.

## Lo que queda para Fase C
- Aplicar este sistema a home, catálogo, ficha de curso y checkout.
- Unificar `Mi cuenta`, `Mis cursos` y `Campus` bajo una misma IA.
- Separar mejor `Panel docente` frente a `Admin`.
- Sustituir variantes one-off de card, inputs y estados por primitives o wrappers compartidos.
