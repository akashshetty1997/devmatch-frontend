/**
 * @file src/contexts/AuthContext.tsx
 * @description Authentication context provider
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "@/services/authService";

interface User {
  id: string;
  username: string;
  email: string;
  role: "DEVELOPER" | "RECRUITER" | "ADMIN";
  avatar: string | null;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: "DEVELOPER" | "RECRUITER";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = !!user;

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check auth status on mount
  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await authService.getMe();
          // Handle nested data structure
          const userData = response.data?.data || response.data;
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [mounted]);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    // Handle nested data structure { success, message, data: { user, token } }
    const responseData = response.data?.data || response.data;
    const { user: userData, token } = responseData;

    localStorage.setItem("token", token);
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    // Handle nested data structure
    const responseData = response.data?.data || response.data;
    const { user: userData, token } = responseData;

    localStorage.setItem("token", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      // Handle nested data structure
      const userData = response.data?.data || response.data;
      setUser(userData);
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: !mounted || loading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};