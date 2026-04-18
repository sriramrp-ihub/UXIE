import { apiClient } from "./client";
import { unwrap } from "./helpers";

import type { ScormInitializeResponse, ScormRegistration, ScormPackage } from "../../types/domain";

export interface ScormRuntimeData {
  id: string;
  registration_id: string;
  key: string;
  value: string;
  updated_at: string;
}

export const scormApi = {
  uploadPackage: async (formData: FormData) => {
    const response = await apiClient.post("/admin/scorm/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<ScormPackage>(response);
  },
  listByCourse: async (courseId: string) =>
    unwrap<ScormPackage[]>(await apiClient.get(`/scorm/course/${courseId}/packages`)),
  initialize: async (packageId: string) =>
    unwrap<ScormInitializeResponse>(await apiClient.post(`/scorm/${packageId}/initialize`)),
  getRuntime: async (registrationId: string, key?: string) =>
    unwrap<{ registration_id: string; data: Record<string, string> }>(
      await apiClient.get(`/scorm/runtime/${registrationId}${key ? `?key=${encodeURIComponent(key)}` : ""}`)
    ),
  setRuntime: async (registrationId: string, payload: { key: string; value: string }) =>
    unwrap<ScormRuntimeData>(await apiClient.post(`/scorm/runtime/${registrationId}`, payload)),
  commit: async (registrationId: string) =>
    unwrap<{ registration_id: string; committed: boolean }>(
      await apiClient.post(`/scorm/runtime/${registrationId}/commit`)
    ),
  finish: async (registrationId: string) =>
    unwrap<ScormRegistration>(await apiClient.post(`/scorm/runtime/${registrationId}/finish`)),
};
