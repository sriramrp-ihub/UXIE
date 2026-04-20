const TOKEN_KEY = "uxie_lms_token";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore write failures (e.g. private mode restrictions).
  }
}

export function clearStoredToken(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore remove failures.
  }
}
