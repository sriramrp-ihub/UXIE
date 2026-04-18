import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { scormApi } from "../../lib/api/scorm.api";

export function useUploadScormMutation() {
  return useMutation({ mutationFn: scormApi.uploadPackage });
}

export function useCourseScormPackages(courseId: string) {
  return useQuery({
    queryKey: ["scorm", "course", courseId, "packages"],
    queryFn: () => scormApi.listByCourse(courseId),
    enabled: !!courseId,
  });
}

export function useInitializeScormMutation() {
  return useMutation({ mutationFn: scormApi.initialize });
}

export function useSetScormRuntimeMutation() {
  return useMutation({
    mutationFn: ({ registrationId, key, value }: { registrationId: string; key: string; value: string }) =>
      scormApi.setRuntime(registrationId, { key, value }),
  });
}

export function useGetScormRuntimeMutation() {
  return useMutation({
    mutationFn: ({ registrationId, key }: { registrationId: string; key?: string }) =>
      scormApi.getRuntime(registrationId, key),
  });
}

export function useCommitScormMutation() {
  return useMutation({ mutationFn: scormApi.commit });
}

export function useFinishScormMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: scormApi.finish,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["analytics", "me"] });
      qc.invalidateQueries({ queryKey: ["courses", "structure"] });
    },
  });
}
