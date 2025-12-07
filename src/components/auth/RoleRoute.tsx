/**
 * @file src/components/auth/RoleRoute.tsx
 * @description Route guard for role-based access control
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "../common/Loading";

interface RoleRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const RoleRoute = ({ children, allowedRoles }: RoleRouteProps) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login
    router.push("/login");
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    // User doesn't have required role
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-red-500">
            Required role: {allowedRoles.join(" or ")}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleRoute;
