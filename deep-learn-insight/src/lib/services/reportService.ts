import apiClient from '../apiClient';

export interface ConceptScore {
  concept_name: string;
  avg_score: number;
  times_evaluated: number;
  latest_status: string;
}

export interface Evaluation {
  integrity_score: number;
  concept: string;
  created_at: string;
}

export interface StudentStats {
  student: {
    id: string;
    name: string;
    email: string;
  };
  evaluationsCount: number;
  averageScore: number;
  recentEvals: Evaluation[];
  conceptMap: ConceptScore[];
}

export interface ClassReport {
  class: {
    id: string;
    teacher_id: string;
    name: string;
  };
  classAverageScore: number;
  studentCount: number;
  commonBlockingConcepts: Array<{
    concept: string;
    affectedStudents: number;
  }>;
  students: StudentStats[];
}

export interface TeacherReportResponse {
  teacherId: string;
  classes: ClassReport[];
}

export interface ActivityLog {
  activity_date: string;
  sessions_count: number;
  total_duration_seconds: number;
}

export interface StudentReport {
  progressCurve: Array<{
    date: string;
    score: number;
    concept: string;
  }>;
  activity: ActivityLog[];
  conceptMap: ConceptScore[];
}

export const reportService = {
  // Teacher Reports
  getTeacherReport: (teacherId: string) =>
    apiClient.get<TeacherReportResponse>(
      `/api/reports/teacher/${teacherId}`
    ),

  // Student Reports
  getStudentReport: (studentId: string) =>
    apiClient.get<StudentReport>(
      `/api/reports/student/${studentId}`
    ),
};

export default reportService;
