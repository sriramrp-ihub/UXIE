import clsx from "clsx";

import { useUiFeedbackStore } from "../store/uiFeedback.store";

export function ToastViewport() {
  const toasts = useUiFeedbackStore((s) => s.toasts);
  const removeToast = useUiFeedbackStore((s) => s.removeToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className={clsx(
            "pointer-events-auto rounded-lg border p-3 shadow-lg",
            toast.type === "loading" && "border-blue-500/40 bg-blue-950/90 text-blue-100",
            toast.type === "success" && "border-emerald-500/40 bg-emerald-950/90 text-emerald-100",
            toast.type === "error" && "border-red-500/40 bg-red-950/90 text-red-100"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.message ? <p className="mt-1 text-xs opacity-90">{toast.message}</p> : null}
            </div>
            <button className="text-xs opacity-80 hover:opacity-100" onClick={() => removeToast(toast.id)}>
              Dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
