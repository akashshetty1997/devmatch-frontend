/**
 * @file src/components/common/Loading.tsx
 * @description Beautiful loading spinner with animations
 */

"use client";

import { motion } from "framer-motion";

interface LoadingProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function Loading({
  fullScreen = false,
  size = "md",
  text,
}: LoadingProps) {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.div
        className={`${sizes[size]} border-4 border-blue-200 border-t-blue-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600 text-sm font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {spinner}
      </motion.div>
    );
  }

  return spinner;
}

// Page loading skeleton
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">Dev</span>
          <span className="text-2xl font-bold text-gray-800">Match</span>
        </div>
        <p className="text-gray-500">Loading...</p>
      </motion.div>
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

// List skeleton loader
export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
