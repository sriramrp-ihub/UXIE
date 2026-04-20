import type { AxiosResponse } from "axios";

import type { ApiEnvelope } from "../../types/domain";

export function unwrap<T>(response: AxiosResponse<ApiEnvelope<T>>): T {
  return response.data.data;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      message?: string;
      code?: string;
      response?: {
        data?: {
          error?: { message?: string } | string;
          data?: { details?: Array<{ loc?: Array<string | number>; msg?: string }> };
        };
      };
    };

    const details = maybe.response?.data?.data?.details;
    if (Array.isArray(details) && details.length > 0) {
      const first = details[0];
      const loc = Array.isArray(first?.loc) ? first.loc.join(".") : "field";
      const msg = first?.msg || "Validation failed";
      return `${loc}: ${msg}`;
    }

    const envelopeError = maybe.response?.data?.error;
    if (typeof envelopeError === "string") return envelopeError;
    if (envelopeError && typeof envelopeError === "object" && "message" in envelopeError) {
      return envelopeError.message || "Request failed";
    }

    if (!maybe.response && maybe.message) {
      return `Network error: ${maybe.message}. Check API URL/connectivity.`;
    }

    if (maybe.code === "ECONNABORTED") {
      return "Request timed out. Backend may be unreachable.";
    }
  }
  return "Request failed";
}
