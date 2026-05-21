# Frontend V2 PR Checklist

## Objetivo
Checklist obligatoria para cualquier PR que toque frontend dentro del sistema premium v2.

## 1. Tokens y estilos
- No introducir nuevos hex directos si ya existe token equivalente.
- No introducir nuevos `rgba(12,113,195,...)` legacy.
- No introducir nuevos radios arbitrarios.
- No introducir nuevas sombras inline si ya existe token equivalente.
- No introducir nuevos gradientes decorativos sin justificar.

## 2. Primitives
- No crear botones manuales si `Button` o `ButtonLink` resuelven el caso.
- No crear banners manuales si `StateBanner` resuelve el caso.
- No crear empty states manuales si `EmptyState` resuelve el caso.
- No crear listas/tablas manuales si `ListRow` o `DataTable` resuelven el caso.
- No crear otra surface paralela si `SurfaceCard` o `Card` ya cubren el patrón.

## 3. Composición
- No introducir nested surfaces sin justificar.
- Priorizar separación por spacing, divisores y jerarquía antes que por más cajas.
- Revisar que metadata, hints y labels no compitan con el contenido principal.

## 4. Responsive
- Si se toca layout, revisar al menos:
  - `390px`
  - `768px`
  - `1024px`
  - `1280px`
- Confirmar que no hay overflow horizontal.
- Confirmar que no hay clipping relevante.
- En móvil, el contenido principal debe ir antes que rails o paneles secundarios.

## 5. Accesibilidad
- Focus visible siempre.
- Contraste suficiente en CTA, badges, metadata y estados.
- Touch targets correctos en móvil.
- No depender solo del color para comunicar estado.

## 6. Estados
- Loading consistente.
- Empty state consistente.
- Error state consistente.
- Retry claro si aplica.
- Disabled legible y no confuso.

## 7. Seguridad de alcance
- No tocar backend ni contratos funcionales salvo necesidad explícita.
- No tocar Prisma.
- No tocar auth.
- No tocar Stripe.
- No tocar storage.
- No tocar server actions si la tarea es visual/técnica.
- No tocar rutas, redirects, query params ni hashes si la tarea es visual/técnica.

## 8. Validación
- Ejecutar `npm run lint` si hubo cambios de código.
- Ejecutar `npm run build` si hubo cambios de código.
- Ejecutar `npm test` si hubo cambios de código.
- Si cambia UI visible, hacer QA visual mínima en las rutas afectadas.
