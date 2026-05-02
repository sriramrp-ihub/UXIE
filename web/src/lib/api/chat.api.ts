import { resolveApiBaseUrl } from "../runtime/environment";

export interface ChatApiResponse {
  response: string;
}

export const chatApi = {
  send: async (query: string): Promise<ChatApiResponse> => {
    const baseUrl = resolveApiBaseUrl();
    const res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`API error (${res.status})`);
    }

    const raw = (await res.json()) as
      | { success?: boolean; data?: ChatApiResponse; error?: unknown }
      | ChatApiResponse;

    if (raw && typeof raw === "object" && "response" in raw) {
      return raw;
    }

    if (raw && typeof raw === "object" && "data" in raw && raw.data?.response) {
      return raw.data;
    }

    throw new Error("Invalid chatbot response");
  },
};
