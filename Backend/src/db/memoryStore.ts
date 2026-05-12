import { InputType, UserRole } from '../types';

export interface MemoryUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  created_at: string;
}

export interface MemorySession {
  id: string;
  user_id: string;
  concept: string;
  input_type: InputType;
  file_path: string | null;
  github_url: string | null;
  document_context: string | null;
  confidence_declared: number;
  duration_minutes: number;
  status: 'active' | 'completed' | 'abandoned';
  integrity_score: number;
  created_at: string;
  completed_at?: string | null;
}

export interface MemoryMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence_bet: number | null;
  is_paste_detected: number;
  created_at: string;
}

export interface MemoryConceptScore {
  id: string;
  session_id: string;
  user_id: string;
  concept_name: string;
  score: number;
  status: string;
  evaluated_at: string;
}

export interface MemoryEvaluation {
  id: string;
  session_id: string;
  user_id: string;
  concept: string;
  integrity_score: number;
  confidence_declared: number;
  calibration_gap: number;
  solid_concepts: string[];
  partial_concepts: string[];
  gap_concepts: string[];
  recommendations: Array<{
    concept: string;
    why: string;
    resource_type: string;
    search_query: string;
  }>;
  duration_seconds: number;
  rounds_count: number;
  created_at: string;
}

export interface MemoryActivityLog {
  activity_date: string;
  sessions_count: number;
  total_duration_seconds: number;
}

export const memoryStore = {
  users: new Map<string, MemoryUser>(),
  usersByEmail: new Map<string, MemoryUser>(),
  sessions: new Map<string, MemorySession>(),
  messagesBySession: new Map<string, MemoryMessage[]>(),
  conceptScoresBySession: new Map<string, MemoryConceptScore[]>(),
  evaluationsByUser: new Map<string, MemoryEvaluation[]>(),
  activityByUser: new Map<string, MemoryActivityLog[]>()
};
