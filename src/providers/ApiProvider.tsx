/**
 * @file src/providers/ApiProvider.tsx
 * @description Connects API service with Toast context for global error handling
 */

"use client";

import { useEffect } from "react";
import { useToast } from "@/contexts/ToastContext";
import { setToastHandler } from "@/services/api";

interface ApiProviderProps {
  children: React.ReactNode;
}

const ApiProvider = ({ children }: ApiProviderProps) => {
  const { error, success, info } = useToast();

  useEffect(() => {
    // Connect toast handler to API service
    setToastHandler((message: string, type: "error" | "success" | "info") => {
      switch (type) {
        case "error":
          error(message);
          break;
        case "success":
          success(message);
          break;
        case "info":
          info(message);
          break;
      }
    });
  }, [error, success, info]);

  return <>{children}</>;
};

export default ApiProvider;
