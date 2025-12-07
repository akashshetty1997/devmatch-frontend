/**
 * @file src/contexts/ErrorContext.tsx
 * @description Global error handling context
 */

"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ErrorState from "@/components/common/ErrorState";

type ErrorType = "network" | "server" | "notFound" | "rateLimit" | "generic" | null;

interface GlobalError {
  type: ErrorType;
  title?: string;
  message?: string;
}

interface ErrorContextType {
  globalError: GlobalError | null;
  setGlobalError: (error: GlobalError | null) => void;
  handleApiError: (error: any) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export function ErrorProvider({ children }: { children: ReactNode }) {
  const [globalError, setGlobalError] = useState<GlobalError | null>(null);

  const handleApiError = useCallback((error: any) => {
    // Don't show global error for every API error - only critical ones
    const status = error.response?.status;

    if (status === 429) {
      setGlobalError({
        type: "rateLimit",
        title: "Too Many Requests",
        message: "Please wait a moment before trying again.",
      });
    } else if (status >= 500) {
      setGlobalError({
        type: "server",
      });
    } else if (!error.response && error.code === "ERR_NETWORK") {
      setGlobalError({
        type: "network",
      });
    }
    // For 4xx errors (except 429), don't show global error - handle locally
  }, []);

  const clearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  return (
    <ErrorContext.Provider
      value={{ globalError, setGlobalError, handleApiError, clearError }}
    >
      {children}
      
      {/* Global Error Overlay */}
      {globalError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full">
            <ErrorState
              type={globalError.type || "generic"}
              title={globalError.title}
              message={globalError.message}
              onRetry={clearError}
              fullPage={false}
            />
          </div>
        </div>
      )}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error("useError must be used within an ErrorProvider");
  }
  return context;
}