type HeaderReader = Pick<Headers, "get">;

function readForwardedAddress(value: string | null) {
  if (!value) {
    return null;
  }

  const candidate = value
    .split(",")[0]
    ?.trim()
    .replace(/^\[|\]$/g, "");

  return candidate || null;
}

export function getClientIpFromHeaders(headers: HeaderReader) {
  return (
    readForwardedAddress(headers.get("x-forwarded-for")) ??
    readForwardedAddress(headers.get("cf-connecting-ip")) ??
    readForwardedAddress(headers.get("x-real-ip")) ??
    readForwardedAddress(headers.get("fly-client-ip")) ??
    "unknown"
  );
}

export function getUserAgentFromHeaders(headers: HeaderReader) {
  return headers.get("user-agent")?.trim().slice(0, 160) || "unknown";
}

export function buildRequestFingerprint(
  headers: HeaderReader,
  extraParts: Array<string | null | undefined> = []
) {
  return [
    getClientIpFromHeaders(headers),
    getUserAgentFromHeaders(headers),
    ...extraParts.map((part) => part?.trim().toLowerCase() || "unknown")
  ].join("|");
}
