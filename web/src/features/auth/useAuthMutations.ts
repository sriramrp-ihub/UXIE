import { useMutation } from "@tanstack/react-query";

import { authApi } from "../../lib/api/auth.api";
import { useAuthStore } from "../../store/auth.store";

export function useLoginMutation() {
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: async (payload: { email: string; password: string }) => {
      const result = await authApi.login(payload);
      if (!result?.access_token) {
        throw new Error("Login response did not include an access token.");
      }
      setToken(result.access_token);
      const me = await authApi.me();
      setUser(me);
      return me;
    },
  });
}

export function useRegisterMutation() {
  return useMutation({ mutationFn: authApi.register });
}

export function useVerifyMutation() {
  return useMutation({ mutationFn: authApi.verify });
}
