import { create } from "zustand";

import { createRuntimeId } from "../lib/runtime/environment";

export type ToastType = "loading" | "success" | "error";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface UiFeedbackState {
  toasts: ToastItem[];
  pushToast: (toast: Omit<ToastItem, "id">, durationMs?: number) => string;
  updateToast: (id: string, patch: Partial<Omit<ToastItem, "id">>, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

function scheduleRemove(id: string, removeToast: (id: string) => void, durationMs: number) {
  globalThis.setTimeout(() => removeToast(id), durationMs);
}

export const useUiFeedbackStore = create<UiFeedbackState>((set, get) => ({
  toasts: [],
  pushToast: (toast, durationMs = 3500) => {
    const id = createRuntimeId("toast");
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast }],
    }));
    if (durationMs > 0) {
      scheduleRemove(id, get().removeToast, durationMs);
    }
    return id;
  },
  updateToast: (id, patch, durationMs = 2500) => {
    set((state) => ({
      toasts: state.toasts.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
    if (durationMs > 0) {
      scheduleRemove(id, get().removeToast, durationMs);
    }
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
  },
}));
