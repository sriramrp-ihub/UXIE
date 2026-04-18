import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ErrorState } from "./components/ErrorState";
import { LoadingState } from "./components/LoadingState";
import { RoleProtectedRoute } from "./components/RoleProtectedRoute";
import { AdminLayout } from "./components/layouts/AdminLayout";
import { MentorLayout } from "./components/layouts/MentorLayout";
import { StudentLayout } from "./components/layouts/StudentLayout";
import { useAuthBootstrap } from "./hooks/useAuthBootstrap";
import { useAuthStore } from "./store/auth.store";
import { roleDashboardPath } from "./utils/roleRouting";

const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RoleLoginPage = lazy(() => import("./pages/auth/RoleLoginPage"));

const StudentDashboardPage = lazy(() => import("./pages/student/StudentDashboardPage"));
const StudentCoursesPage = lazy(() => import("./pages/student/StudentCoursesPage"));
const StudentCourseDetailPage = lazy(() => import("./pages/student/StudentCourseDetailPage"));
const StudentLearningPage = lazy(() => import("./pages/student/StudentLearningPage"));
const StudentQuizPage = lazy(() => import("./pages/student/StudentQuizPage"));
const StudentProfilePage = lazy(() => import("./pages/student/StudentProfilePage"));
const LessonViewerPage = lazy(() => import("./pages/LessonViewerPage"));
const ScormPlayerPage = lazy(() => import("./pages/ScormPlayerPage"));

const MentorDashboardPage = lazy(() => import("./pages/mentor/MentorDashboardPage"));
const MentorCourseManagementPage = lazy(() => import("./pages/mentor/MentorCourseManagementPage"));
const MentorScormManagementPage = lazy(() => import("./pages/mentor/MentorScormManagementPage"));
const MentorQuizManagementPage = lazy(() => import("./pages/mentor/MentorQuizManagementPage"));
const MentorStudentMonitoringPage = lazy(() => import("./pages/mentor/MentorStudentMonitoringPage"));

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
        <Route path="/auth/login/mentor" element={<Navigate to="/login/mentor" replace />} />
        <Route path="/auth/login/admin" element={<Navigate to="/login/admin" replace />} />

        <Route path="/login/student" element={<RoleLoginPage role="student" />} />
        <Route path="/login/mentor" element={<RoleLoginPage role="instructor" />} />
        <Route path="/login/admin" element={<RoleLoginPage role="admin" />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route path="/student" element={<RoleProtectedRoute role="student"><StudentLayout /></RoleProtectedRoute>}>
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="courses" element={<StudentCoursesPage />} />
          <Route path="courses/:courseId" element={<StudentCourseDetailPage />} />
          <Route path="learning" element={<StudentLearningPage />} />
          <Route path="lesson-viewer" element={<LessonViewerPage />} />
          <Route path="quiz" element={<StudentQuizPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="scorm/player/:packageId" element={<ScormPlayerPage />} />
        </Route>

        <Route path="/mentor" element={<RoleProtectedRoute role="instructor"><MentorLayout /></RoleProtectedRoute>}>
          <Route index element={<Navigate to="/mentor/dashboard" replace />} />
          <Route path="dashboard" element={<MentorDashboardPage />} />
          <Route path="courses" element={<MentorCourseManagementPage />} />
          <Route path="scorm" element={<MentorScormManagementPage />} />
          <Route path="quizzes" element={<MentorQuizManagementPage />} />
          <Route path="students" element={<MentorStudentMonitoringPage />} />
        </Route>

        <Route path="/admin" element={<RoleProtectedRoute role="admin"><AdminLayout /></RoleProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route path="/" element={<Navigate to={user ? roleDashboardPath(user.role) : "/login/student"} replace />} />
        <Route path="*" element={<ErrorState title="Page not found" message="The route does not exist." />} />
      </Routes>
    </Suspense>
  );
}

export default App;
