/**
 * @file src/contexts/AuthContext.tsx
 * @description Thin wrapper over Zustand auth store (legacy compatibility)
 */

"use client";

import { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * AuthProvider is now a no-op wrapper.
 * You can keep it in layout/_app to avoid refactors.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

/**
 * useAuth is now just an alias to the Zustand auth store.
 * Any old code using useAuth() will read from the single source of truth.
 */
export const useAuth = useAuthStore;