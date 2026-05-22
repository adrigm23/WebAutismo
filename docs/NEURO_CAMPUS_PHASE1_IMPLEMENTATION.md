# Neuro Campus Phase 1

## Objetivo

Convertir el blueprint en una base tecnica segura sin redisenar pantallas completas ni tocar negocio.

## Cambios aplicados

### Stack

- Se anadieron:
  - `framer-motion`
  - `react-hook-form`
  - `@hookform/resolvers`

### Setup shadcn/ui

- Se anadio `components.json` para dejar el proyecto listo para CLI y generacion de componentes sobre:
  - Next.js App Router
  - `src/app/globals.css`
  - alias `@/*`
  - `src/components/ui`

### Design system base

- Se mantuvo la paleta visual activa para evitar regresiones amplias.
- Se anadieron aliases semanticos y tokens puente en `src/app/globals.css`.
- Se anadio compatibilidad base con tokens semanticos de shadcn para futuras primitives.
- Se anadieron containers auxiliares:
  - `reading-container`
  - `form-container`

## Riesgo diferido y no aplicado

### Cambio de direccion cromatica completa

No se aplico el giro completo de:

- beige calido actual
- a base fria-luminosa del blueprint

Motivo:

- hoy afectaria auth, account, learning, admin, checkout y foro a la vez
- el riesgo de deriva visual y regresion es alto sin validar shell por shell

### Shells canonicos

No se reestructuraron aun:

- auth
- checkout
- success
- campus overview

Motivo:

- eso ya mueve composicion de pantallas, fuera del alcance de esta fase

## Siguiente fase recomendada

1. Normalizar primitives faltantes:
   - checkbox
   - progress
   - dialog
   - select
2. Consolidar shells canonicos sin tocar dominio.
3. Ejecutar migracion visual controlada de tokens por contexto:
   - auth
   - checkout
   - campus overview
   - learning
