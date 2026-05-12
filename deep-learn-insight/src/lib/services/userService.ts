import apiClient from '../apiClient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'professional';
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: 'student' | 'teacher' | 'professional';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ClassPayload {
  name: string;
}

export interface ClassMemberPayload {
  studentId: string;
}

export const userService = {
  // Authentication
  register: (data: RegisterPayload) =>
    apiClient.post<AuthResponse>('/api/users/register', data),

  login: (data: LoginPayload) =>
    apiClient.post<AuthResponse>('/api/users/login', data),

  getCurrentUser: () =>
    apiClient.get<{ user: User }>('/api/users/me'),

  getUser: (userId: string) =>
    apiClient.get<{ user: User }>(`/api/users/${userId}`),

  // Classes (Teacher only)
  createClass: (classData: ClassPayload) =>
    apiClient.post('/api/users/classes', classData),

  addClassMember: (classId: string, data: ClassMemberPayload) =>
    apiClient.post(`/api/users/classes/${classId}/members`, data),
};

export default userService;
