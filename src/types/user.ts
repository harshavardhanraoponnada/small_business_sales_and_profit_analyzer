/**
 * User and Authentication Types
 */

export enum Role {
  OWNER = 'OWNER',
  ACCOUNTANT = 'ACCOUNTANT',
  STAFF = 'STAFF',
}

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface User {
  id: string | number;
  email: string;
  name?: string;
  username?: string;
  role: Role;
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  isActive?: boolean;
  reportFrequency?: string;
  reportFormat?: string;
  reportScheduleTime?: string;
  reportScheduleWeekday?: string;
  receiveScheduledReports?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
