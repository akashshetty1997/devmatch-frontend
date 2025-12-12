/**
 * @file src/contexts/ToastContext.tsx
 * @description Toast notification context (clean, modern, dark-mode safe)
 */

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  createdAt: number;
  durationMs: number;
}

interface ToastContextType {
  success: (message: string, durationMs?: number) => void;
  error: (message: string, durationMs?: number) => void;
  warning: (message: string, durationMs?: number) => void;
  info: (message: string, durationMs?: number) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_DURATION = 4200;
const MAX_TOASTS = 4;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  useEffect(() => setMounted(true), []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  };

  const clear = () => {
    setToasts([]);
    Object.values(timers.current).forEach((t) => window.clearTimeout(t));
    timers.current = {};
  };

  const scheduleDismiss = (toast: Toast) => {
    if (timers.current[toast.id]) window.clearTimeout(timers.current[toast.id]);
    timers.current[toast.id] = window.setTimeout(
      () => dismiss(toast.id),
      toast.durationMs
    );
  };

  const addToast = (
    type: ToastType,
    message: string,
    durationMs = DEFAULT_DURATION
  ) => {
    if (!mounted) return;

    const toast: Toast = {
      id: uid(),
      type,
      message,
      createdAt: Date.now(),
      durationMs,
    };

    setToasts((prev) => {
      const next = [toast, ...prev].slice(0, MAX_TOASTS);
      return next;
    });

    scheduleDismiss(toast);
  };

  // re-schedule after stack truncation
  useEffect(() => {
    toasts.forEach((t) => {
      if (!timers.current[t.id]) scheduleDismiss(t);
    });
    // cleanup orphan timers
    Object.keys(timers.current).forEach((id) => {
      if (!toasts.some((t) => t.id === id)) {
        window.clearTimeout(timers.current[id]);
        delete timers.current[id];
      }
    });
  }, [toasts]);

  const value = useMemo<ToastContextType>(
    () => ({
      success: (m, d) => addToast("success", m, d),
      error: (m, d) => addToast("error", m, d),
      warning: (m, d) => addToast("warning", m, d),
      info: (m, d) => addToast("info", m, d),
      dismiss,
      clear,
    }),
    [mounted]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Render only on client */}
      {mounted && (
        <div className="fixed right-4 top-4 z-[9999] w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <ToastItem
                key={t.id}
                toast={t}
                onDismiss={() => dismiss(t.id)}
                onPause={() => {
                  if (timers.current[t.id]) {
                    window.clearTimeout(timers.current[t.id]);
                    delete timers.current[t.id];
                  }
                }}
                onResume={() => scheduleDismiss(t)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
  onPause,
  onResume,
}: {
  toast: Toast;
  onDismiss: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const meta = getToastMeta(toast.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-auto mb-2"
      onMouseEnter={onPause}
      onMouseLeave={onResume}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl border shadow-lg",
          "bg-white/80 backdrop-blur-md",
          "dark:bg-black/55 dark:border-white/10",
          "border-gray-200",
        ].join(" ")}
        role="status"
        aria-live="polite"
        onClick={onDismiss}
      >
        {/* accent bar */}
        <div className={`absolute left-0 top-0 h-full w-1.5 ${meta.accent}`} />

        <div className="flex gap-3 p-4 pl-4">
          <div
            className={[
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              "border-gray-200 bg-gray-50 text-gray-800",
              "dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80",
            ].join(" ")}
          >
            <meta.Icon className={`h-5 w-5 ${meta.icon}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {meta.title}
            </div>
            <div className="mt-0.5 text-sm text-gray-600 dark:text-white/65">
              {toast.message}
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className={[
              "ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "text-gray-400 hover:bg-black/5 hover:text-gray-700",
              "dark:text-white/35 dark:hover:bg-white/10 dark:hover:text-white",
            ].join(" ")}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* subtle bottom line */}
        <div className="h-px w-full bg-black/5 dark:bg-white/10" />
      </div>
    </motion.div>
  );
}

function getToastMeta(type: ToastType) {
  switch (type) {
    case "success":
      return {
        title: "Success",
        Icon: CheckCircle2,
        accent: "bg-emerald-500",
        icon: "text-emerald-600 dark:text-emerald-300",
      };
    case "error":
      return {
        title: "Error",
        Icon: XCircle,
        accent: "bg-red-500",
        icon: "text-red-600 dark:text-red-300",
      };
    case "warning":
      return {
        title: "Warning",
        Icon: AlertTriangle,
        accent: "bg-amber-500",
        icon: "text-amber-600 dark:text-amber-300",
      };
    default:
      return {
        title: "Info",
        Icon: Info,
        accent: "bg-blue-500",
        icon: "text-blue-600 dark:text-blue-300",
      };
  }
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
