import { create } from "zustand";

import type { User } from "../types/domain";
import { isTokenExpired } from "../utils/jwt";
import { clearStoredToken, getStoredToken, setStoredToken } from "../utils/storage";

interface AuthState {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  hydrateFromStorage: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setToken: (token) => {
    if (token) {
      setStoredToken(token);
    } else {
      clearStoredToken();
    }
    set({ token });
  },
  setUser: (user) => set({ user }),
  hydrateFromStorage: () => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      clearStoredToken();
      set({ token: null, hydrated: true });
      return;
    }
    set({ token, hydrated: true });
  },
  logout: () => {
    clearStoredToken();
    set({ token: null, user: null });
  },
}));
