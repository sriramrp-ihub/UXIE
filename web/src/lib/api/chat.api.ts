import { apiClient } from "./client";
import { unwrap } from "./helpers";

export interface ChatApiResponse {
  response: string;
}

export const chatApi = {
  send: async (query: string) =>
    unwrap<ChatApiResponse>(
      await apiClient.post("/chat", {
        query,
      })
    ),
};
