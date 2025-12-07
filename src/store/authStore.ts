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

  // Actions
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user, profile = null) =>
        set({
          user,
          profile,
          isAuthenticated: !!user,
        }),

      setToken: (token) => {
        if (token) {
          Cookies.set("token", token, { expires: 7 });
          // Also set the default header immediately for subsequent requests
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } else {
          Cookies.remove("token");
          delete api.defaults.headers.common["Authorization"];
        }
        set({ token });
      },

      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login({ email, password });
          const { user, token } = response.data.data;

          // Set token first (this also sets the axios header)
          get().setToken(token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch full user data with profile
          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.register(data);
          const { user, token } = response.data.data;

          // Set token first (this also sets the axios header)
          get().setToken(token);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch full user data with profile
          await get().fetchUser();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        Cookies.remove("token");
        delete api.defaults.headers.common["Authorization"];
        set({
          user: null,
          profile: null,
          token: null,
          isAuthenticated: false,
        });
      },

      fetchUser: async () => {
        const token = get().token || Cookies.get("token");
        if (!token) {
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        // Ensure token is set in axios headers
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

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
          // Token invalid
          Cookies.remove("token");
          delete api.defaults.headers.common["Authorization"];
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
      // Rehydrate: restore axios header when loading from storage
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
        }
      },
    }
  )
);