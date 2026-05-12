export type UserRole = 'student' | 'teacher' | 'professional';
export type InputType = 'document' | 'generic' | 'code';
export type UnderstandingSignal = 'solid' | 'partial' | 'gap' | 'unknown';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
