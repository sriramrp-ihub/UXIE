const params = new URLSearchParams(window.location.search);
const packageId = params.get("packageId");
const apiBase = (params.get("apiBase") || `${window.location.origin}/api/v1`).replace(/\/$/, "");
const tokenFromQuery = params.get("token");
const token = tokenFromQuery || localStorage.getItem("lms_token") || "";

const statusEl = document.getElementById("status");
const frame = document.getElementById("playerFrame");

const state = {
  initialized: false,
  lastError: "0",
  registrationId: null,
  launchUrl: null,
  runtimeData: {},
  dirtyKeys: new Set(),
};

const SCORM_ERRORS = {
  0: "No error",
  101: "General exception",
  201: "Invalid argument error",
  301: "Not initialized",
  403: "Element is read only",
};

function setStatus(msg) {
  statusEl.textContent = msg;
}

function setError(code) {
  state.lastError = String(code);
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.detail || "Request failed");
  }
  return payload?.data;
}

async function initializeSession() {
  if (!packageId) {
    throw new Error("Missing packageId query parameter");
  }

  const data = await fetchJson(`/scorm/${packageId}/initialize`, { method: "POST" });
  state.registrationId = data.session_id;
  state.runtimeData = { ...(data.runtime_data || {}) };

  const launch = data.activities?.[0]?.launch_url || data.package?.file_path;
  if (!launch) {
    throw new Error("Unable to resolve launch URL from SCORM package");
  }

  state.launchUrl = launch.startsWith("http") ? launch : `${window.location.origin}${launch}`;
  frame.src = state.launchUrl;
  setStatus(`Session ${state.registrationId} ready`);
}

async function flushRuntimeKeys() {
  if (!state.registrationId || state.dirtyKeys.size === 0) {
    return;
  }

  const keys = [...state.dirtyKeys];
  state.dirtyKeys.clear();

  await Promise.all(
    keys.map((key) =>
      fetchJson(`/scorm/runtime/${state.registrationId}`, {
        method: "POST",
        body: JSON.stringify({ key, value: state.runtimeData[key] ?? "" }),
      })
    )
  );
}

async function commitRuntime() {
  if (!state.registrationId) return;
  await flushRuntimeKeys();
  await fetchJson(`/scorm/runtime/${state.registrationId}/commit`, { method: "POST" });
}

function bindRuntimeApi() {
  window.API = {
    LMSInitialize(param) {
      if (param !== "") {
        setError(201);
        return "false";
      }
      state.initialized = true;
      setError(0);
      return "true";
    },

    LMSFinish(param) {
      if (param !== "") {
        setError(201);
        return "false";
      }
      if (!state.initialized) {
        setError(301);
        return "false";
      }

      commitRuntime()
        .then(() => fetchJson(`/scorm/runtime/${state.registrationId}/finish`, { method: "POST" }))
        .catch(() => setError(101));

      state.initialized = false;
      setError(0);
      return "true";
    },

    LMSGetValue(key) {
      if (!state.initialized) {
        setError(301);
        return "";
      }
      if (!key || typeof key !== "string") {
        setError(201);
        return "";
      }
      setError(0);
      return state.runtimeData[key] ?? "";
    },

    LMSSetValue(key, value) {
      if (!state.initialized) {
        setError(301);
        return "false";
      }
      if (!key || typeof key !== "string") {
        setError(201);
        return "false";
      }
      state.runtimeData[key] = String(value ?? "");
      state.dirtyKeys.add(key);
      setError(0);
      return "true";
    },

    LMSCommit(param) {
      if (param !== "") {
        setError(201);
        return "false";
      }
      if (!state.initialized) {
        setError(301);
        return "false";
      }

      commitRuntime().catch(() => setError(101));
      setError(0);
      return "true";
    },

    LMSGetLastError() {
      return state.lastError;
    },

    LMSGetErrorString(code) {
      return SCORM_ERRORS[Number(code)] || "Unknown error";
    },

    LMSGetDiagnostic(code) {
      return SCORM_ERRORS[Number(code)] || "Diagnostic unavailable";
    },
  };
}

function setupIframeBridge() {
  frame.addEventListener("load", () => {
    try {
      if (frame.contentWindow) {
        frame.contentWindow.API = window.API;
      }
    } catch {
      // Cross-origin restrictions; package can still use window.parent.API.
    }
  });

  window.addEventListener("message", async (event) => {
    if (event.source !== frame.contentWindow || !event.data || event.data.type !== "SCORM_API_CALL") {
      return;
    }

    const { method, args = [], requestId } = event.data;
    if (!window.API || typeof window.API[method] !== "function") {
      return;
    }

    const result = window.API[method](...args);
    frame.contentWindow?.postMessage(
      {
        type: "SCORM_API_RESULT",
        requestId,
        result,
      },
      "*"
    );
  });
}

(async () => {
  try {
    bindRuntimeApi();
    setupIframeBridge();
    await initializeSession();
  } catch (error) {
    setStatus(`Player init failed: ${error.message}`);
    console.error(error);
  }
})();
