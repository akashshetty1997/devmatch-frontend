/**
 * @file src/hooks/useAuth.ts
 * @description Custom hook for authentication utilities
 */

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export function useAuth(options: UseAuthOptions = {}) {
  const { required = false, redirectTo = "/login", allowedRoles } = options;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    // Redirect if auth is required but user is not authenticated
    if (required && !isAuthenticated) {
      const redirectUrl = pathname 
        ? `${redirectTo}?redirect=${encodeURIComponent(pathname)}`
        : redirectTo;
      router.push(redirectUrl);
      return;
    }

    // Redirect if user doesn't have allowed role
    if (
      isAuthenticated &&
      allowedRoles &&
      user &&
      !allowedRoles.includes(user.role)
    ) {
      router.push("/");
    }
  }, [
    isLoading,
    isAuthenticated,
    required,
    redirectTo,
    pathname,
    router,
    allowedRoles,
    user,
  ]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isDeveloper: user?.role === "DEVELOPER",
    isRecruiter: user?.role === "RECRUITER",
    isAdmin: user?.role === "ADMIN",
  };
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo = "/login") {
  return useAuth({ required: true, redirectTo });
}

/**
 * Hook to require specific role
 */
export function useRequireRole(roles: string[], redirectTo = "/") {
  return useAuth({ required: true, allowedRoles: roles, redirectTo });
}
