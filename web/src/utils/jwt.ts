export interface DecodedJwt {
  exp?: number;
  user_id?: string;
  [key: string]: unknown;
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(atob(payload)) as DecodedJwt;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now;
}
