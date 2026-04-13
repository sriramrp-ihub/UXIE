const $ = (id) => document.getElementById(id);
const output = $("output");

const tokenInput = $("token");
const baseUrlInput = $("baseUrl");

tokenInput.value = localStorage.getItem("lms_token") || "";

function print(data) {
  output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function getBaseUrl() {
  return baseUrlInput.value.replace(/\/$/, "");
}

function authHeaders(extra = {}) {
  const token = tokenInput.value.trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function api(path, { method = "GET", body, headers } = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: headers || authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  print({ status: response.status, ok: response.ok, path, data });
  return { response, data };
}

$("saveTokenBtn").onclick = () => {
  localStorage.setItem("lms_token", tokenInput.value.trim());
  print("Token saved.");
};

$("clearTokenBtn").onclick = () => {
  tokenInput.value = "";
  localStorage.removeItem("lms_token");
  print("Token cleared.");
};

$("registerBtn").onclick = () =>
  api("/auth/register", {
    method: "POST",
    body: {
      name: $("regName").value,
      email: $("regEmail").value,
      password: $("regPassword").value,
      role: $("regRole").value,
    },
  });

$("loginBtn").onclick = async () => {
  const { data } = await api("/auth/login", {
    method: "POST",
    body: {
      email: $("loginEmail").value,
      password: $("loginPassword").value,
    },
  });
  const accessToken = data?.data?.access_token;
  if (accessToken) {
    tokenInput.value = accessToken;
    localStorage.setItem("lms_token", accessToken);
  }
};

$("verifyBtn").onclick = () => {
  const token = $("verifyToken").value.trim();
  return api(`/auth/verify?token=${encodeURIComponent(token)}`);
};

$("meBtn").onclick = () => api("/users/me");
$("listUsersBtn").onclick = () => api("/users");
$("listCoursesBtn").onclick = () => api("/courses");
$("myCoursesBtn").onclick = () => api("/my-courses");
$("globalDashBtn").onclick = () => api("/analytics/dashboard/global");
$("myDashBtn").onclick = () => api("/analytics/dashboard/me");
$("activeUsersBtn").onclick = () => api("/analytics/active-users");

$("createCourseBtn").onclick = () =>
  api("/courses", {
    method: "POST",
    body: {
      title: $("courseTitle").value,
      description: $("courseDesc").value,
    },
  });

$("createModuleBtn").onclick = () =>
  api("/courses/modules", {
    method: "POST",
    body: {
      course_id: $("courseId").value,
      title: $("moduleTitle").value,
      order_index: Number($("moduleOrder").value || 0),
    },
  });

$("createLessonBtn").onclick = () =>
  api("/courses/lessons", {
    method: "POST",
    body: {
      module_id: $("moduleId").value,
      title: $("lessonTitle").value,
      content_type: $("lessonType").value,
      content_url: $("lessonUrl").value,
    },
  });

$("enrollBtn").onclick = () => api(`/enroll/${$("enrollCourseId").value}`, { method: "POST" });

$("progressBtn").onclick = () =>
  api("/progress/update", {
    method: "POST",
    body: {
      lesson_id: $("progressLessonId").value,
      completed: $("progressCompleted").value === "true",
    },
  });

$("getProgressBtn").onclick = () => api(`/progress/${$("progressCourseId").value}`);

$("uploadScormBtn").onclick = async () => {
  const courseId = $("scormCourseId").value;
  const file = $("scormZip").files[0];
  if (!courseId || !file) {
    print("Course ID and ZIP file are required.");
    return;
  }

  const formData = new FormData();
  formData.append("course_id", courseId);
  formData.append("file", file);

  const response = await fetch(`${getBaseUrl()}/scorm/upload`, {
    method: "POST",
    headers: tokenInput.value.trim() ? { Authorization: `Bearer ${tokenInput.value.trim()}` } : {},
    body: formData,
  });

  let data;
  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  print({ status: response.status, ok: response.ok, path: "/scorm/upload", data });
};

$("trackScormBtn").onclick = () =>
  api("/scorm/track", {
    method: "POST",
    body: {
      course_id: $("trackCourseId").value,
      lesson_id: $("trackLessonId").value,
      completion_status: $("trackStatus").value,
      score: Number($("trackScore").value),
      time_spent: Number($("trackTime").value),
    },
  });

$("getQuizBtn").onclick = () => api(`/quiz/${$("quizCourseId").value}`);

$("submitQuizBtn").onclick = () => {
  let answers;
  try {
    answers = JSON.parse($("quizAnswers").value || "[]");
  } catch {
    print("Invalid Answers JSON");
    return;
  }

  return api("/quiz/submit", {
    method: "POST",
    body: {
      quiz_id: $("submitQuizId").value,
      answers,
    },
  });
};

$("courseAnalyticsBtn").onclick = () => api(`/analytics/course/${$("analyticsCourseId").value}`);

print("Ready. Use register/login first, then test APIs.");
