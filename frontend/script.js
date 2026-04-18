const $ = (id) => document.getElementById(id);

const output = $("output");
const tokenInput = $("token");
const baseUrlInput = $("baseUrl");
const userChip = $("userChip");
const viewTitle = $("viewTitle");
const viewSubtitle = $("viewSubtitle");

const viewMeta = {
  authView: { title: "Authentication", subtitle: "Create an account, login, and verify email." },
  dashboardView: { title: "My Dashboard", subtitle: "Your profile and personal LMS metrics." },
  catalogView: { title: "Course Catalog", subtitle: "Discover and enroll in courses." },
  myLearningView: { title: "My Learning", subtitle: "Track progress and learning activity." },
  authoringView: { title: "Instructor Studio", subtitle: "Create courses, modules, lessons, and SCORM uploads." },
  scormView: { title: "SCORM Center", subtitle: "Initialize sessions, update runtime values, and launch player." },
  quizView: { title: "Quiz Center", subtitle: "Load quizzes and submit attempts." },
  analyticsView: { title: "Analytics", subtitle: "Course, personal, and global metrics." },
  adminView: { title: "Admin", subtitle: "Manage platform users." },
};

const state = {
  user: null,
  courses: [],
};

tokenInput.value = localStorage.getItem("lms_token") || "";

function getBaseUrl() {
  return baseUrlInput.value.replace(/\/$/, "");
}

function log(data) {
  output.textContent = typeof data === "string" ? data : JSON.stringify(data, null, 2);
}

function headers(extra = {}) {
  const token = tokenInput.value.trim();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function api(path, { method = "GET", body, customHeaders } = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    method,
    headers: customHeaders || headers(),
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = await response.text();
  }

  const normalized = { status: response.status, ok: response.ok, path, data: payload };
  log(normalized);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || payload?.detail || payload?.error || `Request failed (${response.status})`
    );
  }

  return normalized;
}

function updateRoleVisibility() {
  const role = state.user?.role;
  const adminOnly = document.querySelectorAll(".role-admin");
  const instructorOnly = document.querySelectorAll(".role-instructor");

  adminOnly.forEach((el) => {
    el.classList.toggle("hidden-by-role", role !== "admin");
  });

  instructorOnly.forEach((el) => {
    const allowed = role === "instructor" || role === "admin";
    el.classList.toggle("hidden-by-role", !allowed);
  });
}

function setUserChip() {
  if (!state.user) {
    userChip.textContent = "Not signed in";
    return;
  }
  userChip.textContent = `${state.user.name} · ${state.user.role}`;
}

function activateView(viewId) {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.add("hidden"));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));

  const panel = $(viewId);
  if (panel) panel.classList.remove("hidden");

  const navBtn = document.querySelector(`.nav-btn[data-view='${viewId}']`);
  if (navBtn) navBtn.classList.add("active");

  const meta = viewMeta[viewId];
  if (meta) {
    viewTitle.textContent = meta.title;
    viewSubtitle.textContent = meta.subtitle;
  }
}

function renderKpis(containerId, data = {}) {
  const container = $(containerId);
  container.innerHTML = "";

  const entries = Object.entries(data);
  if (!entries.length) {
    container.innerHTML = "<div class='kpi'><div class='label'>No Data</div><div class='value'>—</div></div>";
    return;
  }

  entries.forEach(([key, value]) => {
    const card = document.createElement("div");
    card.className = "kpi";
    card.innerHTML = `<div class='label'>${key.replaceAll("_", " ")}</div><div class='value'>${value}</div>`;
    container.appendChild(card);
  });
}

function renderCourseList(containerId, courses = [], includeEnroll = false) {
  const container = $(containerId);
  container.innerHTML = "";

  if (!courses.length) {
    container.innerHTML = "<div class='list-item'><small>No courses found.</small></div>";
    return;
  }

  courses.forEach((course) => {
    const card = document.createElement("article");
    card.className = "list-item";
    card.innerHTML = `
      <h4>${course.title}</h4>
      <small>${course.description || "No description"}</small>
      <small>ID: ${course.id}</small>
      <div class="row wrap">
        <button class="ghost" data-action="copy-course" data-id="${course.id}">Copy ID</button>
        <button class="ghost" data-action="open-course" data-id="${course.id}">View Details</button>
        ${includeEnroll ? `<button data-action="enroll-course" data-id="${course.id}">Enroll</button>` : ""}
      </div>
    `;
    container.appendChild(card);
  });
}

async function refreshProfile() {
  if (!tokenInput.value.trim()) {
    state.user = null;
    updateRoleVisibility();
    setUserChip();
    return;
  }

  try {
    const { data } = await api("/users/me");
    state.user = data.data;
    setUserChip();
    updateRoleVisibility();
    $("profileOutput").textContent = JSON.stringify(state.user, null, 2);
  } catch {
    state.user = null;
    setUserChip();
    updateRoleVisibility();
  }
}

async function loadCatalog() {
  const { data } = await api("/courses");
  state.courses = data.data || [];
  renderCourseList("catalogList", state.courses, true);
}

async function loadMyCourses() {
  const { data } = await api("/my-courses");
  renderCourseList("myCoursesList", data.data || []);
}

function attachGlobalListHandlers() {
  document.body.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    if (action === "copy-course") {
      navigator.clipboard.writeText(id).catch(() => null);
      log(`Copied course ID: ${id}`);
      return;
    }

    if (action === "open-course") {
      $("courseDetailId").value = id;
      try {
        const { data } = await api(`/courses/${id}`);
        $("courseDetailOutput").textContent = JSON.stringify(data.data, null, 2);
        activateView("catalogView");
      } catch (error) {
        log(error.message);
      }
      return;
    }

    if (action === "enroll-course") {
      try {
        await api(`/enroll/${id}`, { method: "POST" });
        $("enrollCourseId").value = id;
      } catch (error) {
        log(error.message);
      }
    }
  });
}

$("saveTokenBtn").onclick = async () => {
  localStorage.setItem("lms_token", tokenInput.value.trim());
  await refreshProfile();
  log("Token saved.");
};

$("clearTokenBtn").onclick = () => {
  tokenInput.value = "";
  localStorage.removeItem("lms_token");
  state.user = null;
  setUserChip();
  updateRoleVisibility();
  log("Token cleared.");
};

$("logoutBtn").onclick = () => {
  tokenInput.value = "";
  localStorage.removeItem("lms_token");
  state.user = null;
  setUserChip();
  updateRoleVisibility();
  activateView("authView");
  log("Logged out.");
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
    await refreshProfile();
    activateView("dashboardView");
    $("refreshMeBtn").click();
  }
};

$("verifyBtn").onclick = () => {
  const token = $("verifyToken").value.trim();
  return api(`/auth/verify?token=${encodeURIComponent(token)}`);
};

$("meBtn").onclick = refreshProfile;

$("refreshMeBtn").onclick = async () => {
  const { data } = await api("/analytics/dashboard/me");
  renderKpis("myDashboardCards", data.data);
};

$("listCoursesBtn").onclick = loadCatalog;
$("myCoursesBtn").onclick = loadMyCourses;

$("loadCourseDetailBtn").onclick = async () => {
  const id = $("courseDetailId").value.trim();
  if (!id) return log("Course ID is required.");
  const { data } = await api(`/courses/${id}`);
  $("courseDetailOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("createCourseBtn").onclick = async () => {
  const { data } = await api("/courses", {
    method: "POST",
    body: {
      title: $("courseTitle").value,
      description: $("courseDesc").value,
    },
  });
  const course = data.data;
  if (course?.id) {
    $("courseId").value = course.id;
    $("scormCourseId").value = course.id;
    $("courseDetailId").value = course.id;
  }
};

$("createModuleBtn").onclick = async () => {
  const { data } = await api("/courses/modules", {
    method: "POST",
    body: {
      course_id: $("courseId").value,
      title: $("moduleTitle").value,
      order_index: Number($("moduleOrder").value || 0),
    },
  });
  const moduleData = data.data;
  if (moduleData?.id) {
    $("moduleId").value = moduleData.id;
  }
};

$("createLessonBtn").onclick = async () => {
  const { data } = await api("/courses/lessons", {
    method: "POST",
    body: {
      module_id: $("moduleId").value,
      title: $("lessonTitle").value,
      content_type: $("lessonType").value,
      content_url: $("lessonUrl").value,
    },
  });
  const lesson = data.data;
  if (lesson?.id) {
    $("progressLessonId").value = lesson.id;
    $("scormLessonId").value = lesson.id;
  }
};

$("enrollBtn").onclick = async () => {
  const courseId = $("enrollCourseId").value.trim();
  if (!courseId) return log("Course ID is required.");
  await api(`/enroll/${courseId}`, { method: "POST" });
  await loadMyCourses();
};

$("progressBtn").onclick = async () => {
  const { data } = await api("/progress/update", {
    method: "POST",
    body: {
      lesson_id: $("progressLessonId").value,
      completed: $("progressCompleted").value === "true",
    },
  });
  $("learningOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("getProgressBtn").onclick = async () => {
  const { data } = await api(`/progress/${$("progressCourseId").value}`);
  $("learningOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("uploadScormBtn").onclick = async () => {
  const courseId = $("scormCourseId").value.trim();
  const lessonId = $("scormLessonId").value.trim();
  const title = $("scormTitle").value.trim();
  const file = $("scormZip").files[0];

  if (!courseId || !file) return log("Course ID and SCORM ZIP are required.");

  const form = new FormData();
  form.append("course_id", courseId);
  if (lessonId) form.append("lesson_id", lessonId);
  if (title) form.append("title", title);
  form.append("file", file);

  const response = await fetch(`${getBaseUrl()}/admin/scorm/upload`, {
    method: "POST",
    headers: tokenInput.value.trim() ? { Authorization: `Bearer ${tokenInput.value.trim()}` } : {},
    body: form,
  });
  const payload = await response.json();
  log({ status: response.status, ok: response.ok, path: "/admin/scorm/upload", data: payload });

  const packageId = payload?.data?.id;
  if (packageId) {
    $("runtimePackageId").value = packageId;
    $("playerPackageId").value = packageId;
  }
};

$("initializeScormBtn").onclick = async () => {
  const packageId = $("runtimePackageId").value.trim();
  if (!packageId) return log("Package ID is required.");
  const { data } = await api(`/scorm/${packageId}/initialize`, { method: "POST" });
  const session = data.data?.session_id;
  if (session) {
    $("runtimeRegistrationId").value = session;
  }
  $("scormOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("setRuntimeBtn").onclick = async () => {
  const regId = $("runtimeRegistrationId").value.trim();
  if (!regId) return log("Registration ID is required.");
  await api(`/scorm/runtime/${regId}`, {
    method: "POST",
    body: {
      key: $("runtimeKey").value,
      value: $("runtimeValue").value,
    },
  });
};

$("getRuntimeBtn").onclick = async () => {
  const regId = $("runtimeRegistrationId").value.trim();
  if (!regId) return log("Registration ID is required.");
  const key = $("runtimeKey").value.trim();
  const suffix = key ? `?key=${encodeURIComponent(key)}` : "";
  const { data } = await api(`/scorm/runtime/${regId}${suffix}`);
  $("scormOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("commitRuntimeBtn").onclick = () => {
  const regId = $("runtimeRegistrationId").value.trim();
  if (!regId) return log("Registration ID is required.");
  return api(`/scorm/runtime/${regId}/commit`, { method: "POST" });
};

$("finishRuntimeBtn").onclick = () => {
  const regId = $("runtimeRegistrationId").value.trim();
  if (!regId) return log("Registration ID is required.");
  return api(`/scorm/runtime/${regId}/finish`, { method: "POST" });
};

$("openScormPlayerBtn").onclick = () => {
  const packageId = $("playerPackageId").value.trim() || $("runtimePackageId").value.trim();
  if (!packageId) return log("Package ID is required.");
  const token = encodeURIComponent(tokenInput.value.trim());
  const apiBase = encodeURIComponent(getBaseUrl());
  window.open(
    `/sandbox/scorm-player.html?packageId=${encodeURIComponent(packageId)}&apiBase=${apiBase}&token=${token}`,
    "_blank",
    "noopener,noreferrer"
  );
};

$("getQuizBtn").onclick = async () => {
  const courseId = $("quizCourseId").value.trim();
  if (!courseId) return log("Course ID is required.");
  const { data } = await api(`/quiz/${courseId}`);
  $("quizOutput").textContent = JSON.stringify(data.data, null, 2);
  if (data.data?.id) {
    $("submitQuizId").value = data.data.id;
  }
};

$("submitQuizBtn").onclick = () => {
  let answers;
  try {
    answers = JSON.parse($("quizAnswers").value || "[]");
  } catch {
    return log("Invalid answers JSON.");
  }

  return api("/quiz/submit", {
    method: "POST",
    body: {
      quiz_id: $("submitQuizId").value,
      answers,
    },
  });
};

$("myDashBtn").onclick = async () => {
  const { data } = await api("/analytics/dashboard/me");
  $("analyticsOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("globalDashBtn").onclick = async () => {
  const { data } = await api("/analytics/dashboard/global");
  $("analyticsOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("activeUsersBtn").onclick = async () => {
  const { data } = await api("/analytics/active-users");
  $("analyticsOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("courseAnalyticsBtn").onclick = async () => {
  const courseId = $("analyticsCourseId").value.trim();
  if (!courseId) return log("Course ID is required.");
  const { data } = await api(`/analytics/course/${courseId}`);
  $("analyticsOutput").textContent = JSON.stringify(data.data, null, 2);
};

$("listUsersBtn").onclick = async () => {
  const { data } = await api("/users");
  const users = data.data || [];
  const usersList = $("usersList");
  usersList.innerHTML = "";
  if (!users.length) {
    usersList.innerHTML = "<div class='list-item'><small>No users found.</small></div>";
    return;
  }

  users.forEach((user) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h4>${user.name}</h4>
      <small>${user.email}</small>
      <small>Role: ${user.role} · Verified: ${user.is_verified}</small>
    `;
    usersList.appendChild(item);
  });
};

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => activateView(btn.dataset.view));
});

attachGlobalListHandlers();
updateRoleVisibility();
setUserChip();
refreshProfile();
activateView("authView");
log("LMS portal ready. Login to unlock role-based sections.");
