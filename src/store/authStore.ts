/**
 * @file src/store/authStore.ts
 * @description Authentication state management with Zustand
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import api, { authAPI } from "@/lib/api";

// Types
interface User {
  id: string;
  username: string;
  email: string;
  role: "DEVELOPER" | "RECRUITER" | "ADMIN";
  avatar: string | null;
  createdAt: string;
}

interface Profile {
  _id: string;
  headline?: string;
  bio?: string;
  skills?: string[];
  companyName?: string;
  [key: string]: unknown;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: User | null, profile?: Profile | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    role: "DEVELOPER" | "RECRUITER";
    companyName?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (profile: Profile) => void;
}

// Helper to clear all auth data
const clearAuthData = () => {
  Cookies.remove("token");
  localStorage.removeItem("token");
  delete api.defaults.headers.common["Authorization"];
};

// Helper to set all auth data
const setAuthData = (token: string) => {
  Cookies.set("token", token, { expires: 7 });
  localStorage.setItem("token", token);
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user, profile = null) =>
        set({
          user,
          profile,
          isAuthenticated: !!user,
        }),

      setToken: (token) => {
        if (token) {
          setAuthData(token);
        } else {
          clearAuthData();
        }
        set({ token });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          // Clear any existing auth data first
          clearAuthData();
          set({ user: null, profile: null, token: null, isAuthenticated: false });

          const response = await authAPI.login({ email, password });
          const { user, token } = response.data?.data || {};

          if (!user || !token) {
            const message =
              response.data?.message || "Login failed. Please try again.";
            const axiosError: any = new Error(message);
            axiosError.response = response;
            throw axiosError;
          }

          // Set token everywhere
          setAuthData(token);

          // Update state with user from login response
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch full profile using the NEW token
          try {
            const meResponse = await authAPI.getMe();
            const { profile, ...fullUser } = meResponse.data.data;
            set({
              user: fullUser,
              profile,
            });
          } catch (profileError) {
            // Profile fetch failed but login succeeded - user can still use the app
            console.warn("Failed to fetch profile after login:", profileError);
          }
        } catch (error) {
          clearAuthData();
          set({
            user: null,
            profile: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });

        try {
          // Clear any existing auth data first
          clearAuthData();
          set({ user: null, profile: null, token: null, isAuthenticated: false });

          const response = await authAPI.register(data);
          const { user, token } = response.data?.data || {};

          if (!user || !token) {
            const message =
              response.data?.message ||
              "Registration failed. Please try again.";
            const axiosError: any = new Error(message);
            axiosError.response = response;
            throw axiosError;
          }

          // Set token everywhere
          setAuthData(token);

          // Update state
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch full profile
          try {
            const meResponse = await authAPI.getMe();
            const { profile, ...fullUser } = meResponse.data.data;
            set({
              user: fullUser,
              profile,
            });
          } catch (profileError) {
            console.warn("Failed to fetch profile after register:", profileError);
          }
        } catch (error) {
          clearAuthData();
          set({
            user: null,
            profile: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        // Clear all auth data
        clearAuthData();
        
        // Update state first
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
        });
        
        // Clear persisted storage AFTER state update
        // Use setTimeout to ensure it runs after Zustand's persist middleware
        setTimeout(() => {
          localStorage.removeItem("auth-storage");
        }, 0);
      },

      fetchUser: async () => {
        // Get token from state first, then fallbacks
        const token = get().token || localStorage.getItem("token") || Cookies.get("token");
        
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        // Ensure token is set in all places
        setAuthData(token);
        set({ isLoading: true });

        try {
          const response = await authAPI.getMe();
          const { profile, ...user } = response.data.data;

          set({
            user,
            profile,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          clearAuthData();
          localStorage.removeItem("auth-storage");
          set({
            user: null,
            profile: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateProfile: (profile) => set({ profile }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthData(state.token);
        }
      },
    }
  )
);