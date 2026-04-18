import { useEffect } from "react";

import { authApi } from "../lib/api/auth.api";
import { useAuthStore } from "../store/auth.store";

export function useAuthBootstrap() {
  const { token, hydrated, hydrateFromStorage, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrateFromStorage();
    }
  }, [hydrateFromStorage, hydrated]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    authApi
      .me()
      .then(setUser)
      .catch(() => logout());
  }, [token, setUser, logout]);

  return { ready: hydrated };
}
