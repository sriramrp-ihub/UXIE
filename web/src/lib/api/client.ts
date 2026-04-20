import axios from "axios";

import { useAuthStore } from "../../store/auth.store";
import { useUiFeedbackStore } from "../../store/uiFeedback.store";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

function shouldTrackFeedback(method?: string, url?: string) {
  const normalizedMethod = (method ?? "get").toLowerCase();
  if (["get", "head", "options"].includes(normalizedMethod)) return false;
  if (!url) return false;
  if (url.includes("/scorm/runtime/")) return false;
  return true;
}

function actionLabel(method?: string, url?: string) {
  const normalizedMethod = (method ?? "post").toUpperCase();
  if (!url) return `${normalizedMethod} request`;

  if (url.includes("/auth/login")) return "Signing in";
  if (url.includes("/auth/register")) return "Creating account";
  if (url.includes("/courses")) return normalizedMethod === "POST" ? "Saving course changes" : "Updating course";
  if (url.includes("/enroll/")) return "Enrolling in course";
  if (url.includes("/progress/update")) return "Saving progress";
  if (url.includes("/quiz/submit")) return "Submitting quiz";
  if (url.includes("/admin/scorm/upload")) return "Uploading SCORM package";
  if (url.includes("/scorm/") && url.includes("/finish")) return "Finalizing SCORM session";
  return "Processing your action";
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (shouldTrackFeedback(config.method, config.url)) {
    const toastId = useUiFeedbackStore.getState().pushToast(
      {
        type: "loading",
        title: actionLabel(config.method, config.url),
        message: "Please wait...",
      },
      0
    );
    (config as { __toastId?: string }).__toastId = toastId;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const toastId = (response.config as { __toastId?: string }).__toastId;
    if (toastId) {
      useUiFeedbackStore.getState().updateToast(
        toastId,
        {
          type: "success",
          title: "Done",
          message: "Your action completed successfully.",
        },
        2200
      );
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const toastId = (error?.config as { __toastId?: string } | undefined)?.__toastId;
    const detail =
      error?.response?.data?.error?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.detail ||
      "Request failed. Please try again.";

    if (toastId) {
      useUiFeedbackStore.getState().updateToast(
        toastId,
        {
          type: "error",
          title: "Action failed",
          message: String(detail),
        },
        4500
      );
    } else if (status === 403 || status >= 500) {
      const title = status === 403 ? "Access denied" : "Server error";
      const message = status === 403 ? "You do not have permission to perform this action." : String(detail);
      useUiFeedbackStore.getState().pushToast(
        {
          type: "error",
          title,
          message,
        },
        5000
      );
    }

    if (status === 401) {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith("/login/")) {
        window.location.href = "/login/student";
      }
    }
    return Promise.reject(error);
  }
);
