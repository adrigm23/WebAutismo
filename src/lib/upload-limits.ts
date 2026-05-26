// Keep the app-level limit below the transport limits configured in next.config.ts so
// oversized uploads are rejected by our own validation instead of failing earlier.
export const MAX_APP_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
