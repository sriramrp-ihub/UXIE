import { apiClient } from "./client";
import { unwrap } from "./helpers";

import type { TokenResponse, User } from "../../types/domain";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "student" | "instructor" | "admin";
}

interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => unwrap<User>(await apiClient.post("/auth/register", payload)),
  login: async (payload: LoginPayload) => unwrap<TokenResponse>(await apiClient.post("/auth/login", payload)),
  verify: async (token: string) => unwrap<{ message: string; user_id: string }>(await apiClient.get(`/auth/verify?token=${encodeURIComponent(token)}`)),
  me: async () => unwrap<User>(await apiClient.get("/users/me")),
};
