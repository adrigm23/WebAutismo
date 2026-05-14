## Migration Notes

This project started from an existing MySQL schema without Prisma migration history.

- `0000_existing_baseline` captures the schema that already existed in the database.
- `*_hardening_observability_storage` captures the hardening, account-security and `courseId` transition changes added in this refactor.

For an existing environment that already contains the baseline schema:

1. Mark the baseline as applied:
   `npx prisma migrate resolve --applied 0000_existing_baseline`
2. Deploy the new migration:
   `npx prisma migrate deploy`

For a fresh environment:

1. Run:
   `npx prisma migrate deploy`

If binary assets still exist in `StoredAsset`, configure object storage first and then run:

- `npm run storage:migrate`
