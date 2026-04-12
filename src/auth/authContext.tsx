/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";
import api from "../services/api";

export interface AuthUser {
  role: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const clearStoredAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("token");
  window.localStorage.removeItem("user");
};

const parseStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const role = (parsed as { role?: unknown }).role;
    if (typeof role !== "string" || role.trim().length === 0) {
      return null;
    }

    return {
      ...(parsed as Record<string, unknown>),
      role,
    };
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    return true;
  }

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return true;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (typeof payload.exp !== "number") {
      return false;
    }

    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
};

const getInitialUser = (): AuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token = window.localStorage.getItem("token");
  const user = parseStoredUser();

  if (!token || !user || isTokenExpired(token)) {
    clearStoredAuth();
    return null;
  }

  return user;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(getInitialUser);

  const login = async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password });

    const token = response?.data?.token;
    const responseRole = response?.data?.role ?? response?.data?.user?.role;

    if (typeof token !== "string" || token.length === 0) {
      throw new Error("Invalid login response: token missing");
    }

    if (typeof responseRole !== "string" || responseRole.length === 0) {
      throw new Error("Invalid login response: role missing");
    }

    const responseUser = response?.data?.user;
    const nextUser: AuthUser = {
      ...(responseUser && typeof responseUser === "object"
        ? (responseUser as Record<string, unknown>)
        : {}),
      role: responseRole,
    };

    if (typeof window !== "undefined") {
      window.localStorage.setItem("token", token);
      window.localStorage.setItem("user", JSON.stringify(nextUser));
    }

    setUser(nextUser);
  };

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
