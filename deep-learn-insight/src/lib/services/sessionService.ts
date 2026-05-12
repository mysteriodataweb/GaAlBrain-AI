import apiClient from '../apiClient';

export interface CreateSessionPayload {
  userId?: string;
  concept: string;
  inputType?: 'document' | 'generic' | 'code';
  githubUrl?: string;
  confidence?: number;
  duration?: number;
}

export interface SendMessagePayload {
  content: string;
  confidenceBet?: number;
  isPasteSuspected?: boolean;
}

export interface SessionResponse {
  sessionId: string;
  intro?: string | null;
  firstQuestion: string;
  feedback_type?: string;
  question_type?: string;
  understanding_signal?: string;
  documentContext?: string | null;
}

export interface MessageResponse {
  messageId: string;
  question: string;
  question_type?: string;
  feedback_type: string;
  understanding_signal: string;
  confidence_level: string;
  reasoning: string;
  escalate_difficulty?: boolean;
}

export interface SessionData {
  id: string;
  user_id: string;
  concept: string;
  input_type: string;
  file_path: string | null;
  github_url: string | null;
  document_context: string | null;
  confidence_declared: number;
  duration_minutes: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SessionMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  confidence_bet: number | null;
  is_paste_detected: number;
  created_at: string;
}

export interface ConceptScore {
  id: string;
  session_id: string;
  user_id: string;
  concept_name: string;
  score: number;
  status: string;
  evaluated_at: string;
}

export interface SessionDetailsResponse {
  session: SessionData;
  messages: SessionMessage[];
  conceptScores: ConceptScore[];
}

export interface EvaluationResults {
  evaluationId?: string;
  integrity_score: number;
  calibration_gap: number;
  calibration_label?: string;
  cognitive_profile?: string;
  solid_concepts?: string[];
  partial_concepts?: string[];
  gap_concepts?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: Array<{
    concept: string;
    why: string;
    prerequisite_missing?: string | null;
    resource_type: string;
    search_query: string;
  }>;
  metacognition_note?: string;
  summary?: string;
  duration_seconds?: number;
  rounds_count?: number;
}

export const sessionService = {
  // Session Management
  createSession: (data: CreateSessionPayload) => {
    const formData = new FormData();
    formData.append('concept', data.concept);
    formData.append('inputType', data.inputType || 'generic');
    if (data.userId) formData.append('userId', data.userId);
    if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
    if (data.confidence !== undefined) {
      formData.append('confidence', String(data.confidence));
    }
    if (data.duration !== undefined) {
      formData.append('duration', String(data.duration));
    }

    return apiClient.post<SessionResponse>('/api/sessions', formData);
  },

  createSessionWithFile: (
    data: CreateSessionPayload & { file: File }
  ) => {
    const formData = new FormData();
    formData.append('concept', data.concept);
    formData.append('inputType', data.inputType || 'generic');
    formData.append('file', data.file);
    if (data.userId) formData.append('userId', data.userId);
    if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
    if (data.confidence !== undefined) {
      formData.append('confidence', String(data.confidence));
    }
    if (data.duration !== undefined) {
      formData.append('duration', String(data.duration));
    }

    return apiClient.post<SessionResponse>('/api/sessions', formData);
  },

  getSession: (sessionId: string) =>
    apiClient.get<SessionDetailsResponse>(`/api/sessions/${sessionId}`),

  sendMessage: (sessionId: string, data: SendMessagePayload) =>
    apiClient.post<MessageResponse>(
      `/api/sessions/${sessionId}/message`,
      data
    ),

  endSession: (sessionId: string) =>
    apiClient.post<EvaluationResults>(`/api/sessions/${sessionId}/complete`),

  getSessionEvaluation: (sessionId: string) =>
    apiClient.get<{ evaluation: EvaluationResults & Record<string, any> }>(
      `/api/sessions/${sessionId}/evaluation`
    ),

  getSessions: (userId?: string) => {
    const params = userId ? { userId } : {};
    return apiClient.get<SessionData[]>('/api/sessions', { params });
  },
};

export default sessionService;
