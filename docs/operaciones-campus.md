# Operaciones del campus

## Progreso real por modulo

- El progreso ya no se interpreta por posicion visual del modulo.
- Cada modulo del catalogo tiene un `id` estable en `src/data/courses.ts`.
- La tabla `CourseModuleProgress` guarda `courseSlug`, `moduleId` y conserva `moduleIndex` solo como compatibilidad con registros legacy.
- La logica del campus y de `Mi cuenta` usa `moduleId` como referencia principal.

## Compatibilidad con progreso legacy

- Si existen registros antiguos con `moduleId` vacio pero `moduleIndex` valido, `src/lib/course-progress.ts` los normaliza y actualiza cuando el usuario vuelve a cargar progreso.
- Esto evita perder marcas ya guardadas tras la migracion.

## Limitacion actual

- Aunque el progreso ya depende de `moduleId`, la tabla sigue conservando `moduleIndex` como apoyo para compatibilidad historica.
- Si en el futuro se eliminan todos los registros legacy, se puede simplificar el modelo y retirar ese campo.

## Migracion de adjuntos legacy

- Los nuevos adjuntos privados se guardan bajo `storage/forum/...`.
- Los adjuntos antiguos pueden seguir existiendo en `public/uploads/forum/...`.
- Para migrarlos:

```bash
npm run attachments:migrate
```

- Para revisar sin mover archivos:

```bash
node scripts/migrate-forum-attachments.mjs --dry-run
```

## Verificacion recomendada

```bash
npm run test:unit
npm run lint
npm run build
```
