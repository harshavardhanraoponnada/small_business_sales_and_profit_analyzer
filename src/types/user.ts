/**
 * User and Authentication Types
 */

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export interface User {
  id: string | number;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginPayload {
  email: string;
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
