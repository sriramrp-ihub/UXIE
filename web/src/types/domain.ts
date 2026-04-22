export type UserRole = "student" | "instructor" | "admin";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: { message?: string } | string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor_id: string;
  instructor_name?: string | null;
  modules_count?: number;
  lessons_count?: number;
  created_at: string;
  modules?: ModuleWithLessons[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: "video" | "text" | "scorm";
  content_url: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface Progress {
  user_id: string;
  lesson_id: string;
  lesson_title?: string | null;
  module_id?: string | null;
  module_title?: string | null;
  course_id?: string;
  course_title?: string | null;
  completed: boolean;
  completed_at: string | null;
  completion_percentage?: number;
}

export interface ProgressSummary {
  course_id: string;
  course_title: string | null;
  completion_percentage: number;
  items: Progress[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface Quiz {
  id: string;
  course_id: string;
  course_title?: string | null;
  question_count?: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id?: string | null;
  quiz_title?: string;
  course_title?: string | null;
  score: number;
  passed?: boolean;
  message?: string;
  submitted_at: string;
}

export interface ScormPackage {
  id: string;
  course_id: string;
  lesson_id: string | null;
  title: string;
  version: string;
  launch_file: string;
  extracted_path: string;
  file_path: string;
  created_at: string;
  activity_count?: number;
  is_single_sco?: boolean;
  health_warning?: string | null;
}

export interface ScormActivity {
  id: string;
  package_id: string;
  identifier: string;
  title: string;
  launch_url: string;
}

export interface ScormRegistration {
  id: string;
  user_id: string;
  package_id: string;
  started_at: string;
  completed_at: string | null;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

export interface ScormInitializeResponse {
  session_id: string;
  registration: ScormRegistration;
  package: ScormPackage;
  activities: ScormActivity[];
  runtime_data: Record<string, string>;
}

export interface ScormReport {
  completion: number;
  status: string;
  score: number | null;
  timeSpent: number;
  lastAccessed: string;
}
