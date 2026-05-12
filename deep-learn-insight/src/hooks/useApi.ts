import { useMutation, useQuery } from '@tanstack/react-query';
import userService, {
  RegisterPayload,
  LoginPayload,
  ClassPayload,
  ClassMemberPayload,
} from '../lib/services/userService';
import sessionService, {
  CreateSessionPayload,
  SendMessagePayload,
} from '../lib/services/sessionService';
import uploadService from '../lib/services/uploadService';
import reportService from '../lib/services/reportService';

// ===== AUTH HOOKS =====
export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterPayload) => userService.register(data),
  });
};

export const useLogin = () => {
  return useMutation({
    mutationFn: (data: LoginPayload) => userService.login(data),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: () => userService.getCurrentUser(),
    retry: 1,
  });
};

export const useUser = (userId: string | null) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userService.getUser(userId!),
    enabled: !!userId,
  });
};

// ===== CLASS HOOKS =====
export const useCreateClass = () => {
  return useMutation({
    mutationFn: (data: ClassPayload) => userService.createClass(data),
  });
};

export const useAddClassMember = () => {
  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: ClassMemberPayload;
    }) => userService.addClassMember(classId, data),
  });
};

// ===== SESSION HOOKS =====
export const useCreateSession = () => {
  return useMutation({
    mutationFn: (data: CreateSessionPayload) =>
      sessionService.createSession(data),
  });
};

export const useCreateSessionWithFile = () => {
  return useMutation({
    mutationFn: (data: CreateSessionPayload & { file: File }) =>
      sessionService.createSessionWithFile(data),
  });
};

export const useSession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionService.getSession(sessionId!),
    enabled: !!sessionId,
  });
};

export const useSendMessage = () => {
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: SendMessagePayload;
    }) => sessionService.sendMessage(sessionId, data),
  });
};

export const useEndSession = () => {
  return useMutation({
    mutationFn: (sessionId: string) => sessionService.endSession(sessionId),
  });
};

export const useSessionEvaluation = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['session', sessionId, 'evaluation'],
    queryFn: () => sessionService.getSessionEvaluation(sessionId!),
    enabled: !!sessionId,
    retry: 1,
  });
};

export const useSessions = (userId?: string) => {
  return useQuery({
    queryKey: ['sessions', userId],
    queryFn: () => sessionService.getSessions(userId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

// ===== UPLOAD HOOKS =====
export const useUploadLimits = () => {
  return useQuery({
    queryKey: ['upload', 'limits'],
    queryFn: () => uploadService.getLimits(),
  });
};

// ===== REPORT HOOKS =====
export const useTeacherReport = (teacherId: string | null) => {
  return useQuery({
    queryKey: ['report', 'teacher', teacherId],
    queryFn: () => reportService.getTeacherReport(teacherId!),
    enabled: !!teacherId,
  });
};

export const useStudentReport = (studentId: string | null) => {
  return useQuery({
    queryKey: ['report', 'student', studentId],
    queryFn: () => reportService.getStudentReport(studentId!),
    enabled: !!studentId,
  });
};

export const useStudentStats = (studentId: string | null) => {
  return useQuery({
    queryKey: ['report', 'student', studentId],
    queryFn: () => reportService.getStudentReport(studentId!),
    enabled: !!studentId,
  });
};
