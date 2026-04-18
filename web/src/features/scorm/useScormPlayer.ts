import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { scormApi } from "../../lib/api/scorm.api";

interface ScormApiBridge {
  LMSInitialize: (param: string) => string;
  LMSFinish: (param: string) => string;
  LMSGetValue: (key: string) => string;
  LMSSetValue: (key: string, value: string) => string;
  LMSCommit: (param: string) => string;
  LMSGetLastError: () => string;
}

const MAX_RUNTIME_VALUE_LENGTH = 4000;

function normalizeRuntimeValue(value: unknown): string {
  const text = String(value ?? "");
  return text.length > MAX_RUNTIME_VALUE_LENGTH ? text.slice(0, MAX_RUNTIME_VALUE_LENGTH) : text;
}

export function useScormPlayer(packageId: string, frameRef: React.RefObject<HTMLIFrameElement | null>) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("Booting SCORM runtime...");
  const [currentLaunchUrl, setCurrentLaunchUrl] = useState("");

  const runtimeRef = useRef<Record<string, string>>({});
  const dirtyKeysRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const lastErrorRef = useRef("0");
  const registrationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!packageId) return;

    const setupSession = async () => {
      const initialized = await scormApi.initialize(packageId);
      registrationIdRef.current = initialized.session_id;
      runtimeRef.current = { ...(initialized.runtime_data ?? {}) };
      const launch = initialized.activities?.[0]?.launch_url || initialized.package.file_path;
      let resolvedPath = launch;
      if (launch.startsWith("http")) {
        const parsed = new URL(launch);
        resolvedPath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      const normalizedLaunch = resolvedPath.startsWith("/") ? resolvedPath : `/${resolvedPath}`;
      const url = `${window.location.origin}${normalizedLaunch}`;
      setCurrentLaunchUrl(url);
      if (frameRef.current) {
        frameRef.current.src = url;
      }
      setStatus(`SCORM initialized (${initialized.session_id})`);
    };

    setupSession().catch(() => setStatus("Failed to initialize SCORM"));
  }, [packageId, frameRef]);

  useEffect(() => {
    const flush = async () => {
      const registrationId = registrationIdRef.current;
      if (!registrationId || !dirtyKeysRef.current.size) return;

      const keys = [...dirtyKeysRef.current];
      dirtyKeysRef.current.clear();

      const writes = await Promise.allSettled(
        keys.map((key) =>
          scormApi.setRuntime(registrationId, {
            key,
            value: normalizeRuntimeValue(runtimeRef.current[key]),
          })
        )
      );

      const failedWrites = writes.filter((result) => result.status === "rejected").length;
      if (failedWrites > 0) {
        setStatus(
          `Progress saved with ${failedWrites} runtime warning${failedWrites > 1 ? "s" : ""}. Finalization will continue.`
        );
      }
    };

    const apiBridge: ScormApiBridge = {
      LMSInitialize: (param) => {
        if (param !== "") {
          lastErrorRef.current = "201";
          return "false";
        }
        initializedRef.current = true;
        lastErrorRef.current = "0";
        return "true";
      },
      LMSFinish: (param) => {
        if (param !== "" || !initializedRef.current) {
          lastErrorRef.current = "301";
          return "false";
        }
        const registrationId = registrationIdRef.current;
        if (registrationId) {
          setStatus("Finalizing SCORM session...");
          flush()
            .then(() => scormApi.commit(registrationId))
            .then(() => scormApi.finish(registrationId))
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ["progress"] });
              queryClient.invalidateQueries({ queryKey: ["analytics", "me"] });
              queryClient.invalidateQueries({ queryKey: ["courses", "structure"] });
              setStatus("SCORM completed. Progress synced to your learning dashboard.");
            })
            .catch(() => {
              lastErrorRef.current = "101";
              setStatus("SCORM ended, but progress sync failed. Please return and try again.");
            });
        }
        initializedRef.current = false;
        lastErrorRef.current = "0";
        return "true";
      },
      LMSGetValue: (key) => {
        if (!initializedRef.current) {
          lastErrorRef.current = "301";
          return "";
        }
        lastErrorRef.current = "0";
        return runtimeRef.current[key] ?? "";
      },
      LMSSetValue: (key, value) => {
        if (!initializedRef.current) {
          lastErrorRef.current = "301";
          return "false";
        }
        runtimeRef.current[key] = String(value ?? "");
        dirtyKeysRef.current.add(key);
        lastErrorRef.current = "0";
        return "true";
      },
      LMSCommit: (param) => {
        if (param !== "" || !initializedRef.current) {
          lastErrorRef.current = "301";
          return "false";
        }
        const registrationId = registrationIdRef.current;
        if (registrationId) {
          setStatus("Saving SCORM progress...");
          flush()
            .then(() => scormApi.commit(registrationId))
            .then(() => setStatus("Progress saved. Continue learning."))
            .catch(() => {
              lastErrorRef.current = "101";
              setStatus("Could not save progress right now.");
            });
        }
        lastErrorRef.current = "0";
        return "true";
      },
      LMSGetLastError: () => lastErrorRef.current,
    };

    (window as Window & { API?: ScormApiBridge }).API = apiBridge;

    const onFrameLoad = () => {
      try {
        if (frameRef.current?.contentWindow) {
          (frameRef.current.contentWindow as Window & { API?: ScormApiBridge }).API = apiBridge;
        }
      } catch {
        // Cross-origin fallback; SCO can use window.parent.API.
      }
    };

    const frameNode = frameRef.current;
    frameNode?.addEventListener("load", onFrameLoad);
    return () => frameNode?.removeEventListener("load", onFrameLoad);
  }, [frameRef, queryClient]);

  return {
    status,
    currentLaunchUrl,
  };
}
