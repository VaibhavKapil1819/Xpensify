// models/user.ts
import { RiskLevel, LearningPreference } from '@prisma/client';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  primary_goal: string | null;
  risk_level: RiskLevel | null;
  learning_preference: LearningPreference | null;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  access_token: string;
  expires_at: number;
  user: User;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface AuthError {
  message: string;
  code?: string;
}
