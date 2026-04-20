function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  // Default to same-origin + Vite proxy in development, and same-origin API path in production.
  return "/api/v1";
}

export function getCurrentPathname(): string {
  return typeof window !== "undefined" ? window.location.pathname : "";
}

export function redirectTo(path: string): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === path) return;
  window.location.assign(path);
}

function fromRandomValues(): string | null {
  const maybeCrypto = globalThis.crypto as Crypto | undefined;
  if (!maybeCrypto?.getRandomValues) {
    return null;
  }

  const bytes = new Uint8Array(16);
  maybeCrypto.getRandomValues(bytes);

  // RFC4122 v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function createRuntimeId(prefix = "id"): string {
  const maybeCrypto = globalThis.crypto as Crypto | undefined;
  if (typeof maybeCrypto?.randomUUID === "function") {
    return `${prefix}-${maybeCrypto.randomUUID()}`;
  }

  const randomValuesId = fromRandomValues();
  if (randomValuesId) {
    return `${prefix}-${randomValuesId}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}
