import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorState } from "./components/ErrorState";
import { LoadingState } from "./components/LoadingState";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { StudentLayout } from "./components/layouts/StudentLayout";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useAuthStore } from "./store/auth.store";
import { roleDashboardPath } from "./utils/roleRouting";

const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RoleLoginPage = lazy(() => import("./pages/auth/RoleLoginPage"));

const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboardPage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentCourseDetailPage = lazy(() => import("./pages/student/StudentCourseDetailPage"));
const StudentCertificatesPage = lazy(() => import("./pages/student/StudentCertificatesPage"));
const StudentLearningPage = lazy(() => import("./pages/student/StudentLearningPage"));
const StudentQuizPage = lazy(() => import("./pages/student/StudentQuizPage"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage"));
const LessonViewerPage = lazy(() => import("./pages/LessonViewerPage"));
const ScormPlayerPage = lazy(() => import("./pages/ScormPlayerPage"));

const AdminCourseManagementPage = lazy(() => import("./pages/admin/AdminCourseManagementPage"));

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminCoursesPage = lazy(() => import("./pages/admin/AdminCoursesPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));

function App() {
  const { ready } = useAuthBootstrap();
  const user = useAuthStore((s) => s.user);

  if (!ready) {
    return <LoadingState message="Bootstrapping session..." />;
  }

  return (
    <Suspense fallback={<LoadingState message="Loading page..." />}>
      <Routes>
        <Route path="/auth/login" element={<Navigate to="/login/student" replace />} />
        <Route path="/auth/login/student" element={<Navigate to="/login/student" replace />} />
        <Route path="/auth/login/admin" element={<Navigate to="/login/admin" replace />} />

        <Route path="/login/student" element={<RoleLoginPage role="student" />} />
        <Route path="/login/admin" element={<RoleLoginPage role="admin" />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route path="/student" element={<RoleProtectedRoute role="student"><StudentLayout /></RoleProtectedRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
          <Route path="certificates" element={<StudentCertificatesPage />} />
          <Route path="learning" element={<Navigate to="/student/courses" replace />} />
          <Route path="lesson-viewer" element={<LessonViewerPage />} />
          <Route path="quiz" element={<Navigate to="/student/courses" replace />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="scorm/player/:packageId" element={<ScormPlayerPage />} />
          <Route path="legacy-learning" element={<StudentLearningPage />} />
          <Route path="legacy-quiz" element={<StudentQuizPage />} />
        </Route>

        <Route path="/admin" element={<RoleProtectedRoute role="admin"><AdminLayout /></RoleProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="course-management" element={<AdminCourseManagementPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route path="/" element={<Navigate to={user ? roleDashboardPath(user.role) : "/login/student"} replace />} />
        <Route path="*" element={<ErrorState title="Page not found" message="The route does not exist." />} />
      </Routes>
    </Suspense>
  );
}

export default App;
