/**
 * @file src/services/api.ts
 * @description Axios instance configuration with global error handling
 */

import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Error message helper
const getErrorMessage = (error: AxiosError): string => {
  // Network error (server down, no internet)
  if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
    return "Unable to connect to server. Please check your connection.";
  }

  // Timeout
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  // Server responded with error
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    // Use server message if available
    if (data?.message) {
      return data.message;
    }

    // Default messages by status code
    switch (status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Please login to continue.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 409:
        return "This resource already exists.";
      case 422:
        return "Invalid data provided.";
      case 429:
        return "Too many requests. Please slow down.";
      case 500:
        return "Server error. Please try again later.";
      case 502:
      case 503:
      case 504:
        return "Server is temporarily unavailable. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return "An unexpected error occurred.";
};

// Store for toast function (will be set by ApiProvider)
let showToast: ((message: string, type: "error" | "success" | "info") => void) | null = null;

// Function to set toast handler (called from ApiProvider)
export const setToastHandler = (
  handler: (message: string, type: "error" | "success" | "info") => void
) => {
  showToast = handler;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }

    // Show toast notification for errors
    if (showToast) {
      const message = getErrorMessage(error);
      showToast(message, "error");
    }

    return Promise.reject(error);
  }
);

export default api;