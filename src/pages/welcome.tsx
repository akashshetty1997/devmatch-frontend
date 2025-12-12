/**
 * @file src/pages/welcome.tsx
 * @description Animated welcome page shown after registration
 */

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

type Hello = { text: string; lang: string };

export default function WelcomePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinal, setShowFinal] = useState(false);

  const greetings: Hello[] = useMemo(
    () => [
      { text: "Welcome", lang: "English" },
      { text: "स्वागत है", lang: "Hindi" },
      { text: "Bienvenido", lang: "Spanish" },
      { text: "Bienvenue", lang: "French" },
      { text: "Benvenuto", lang: "Italian" },
      { text: "ようこそ", lang: "Japanese" },
      { text: "환영합니다", lang: "Korean" },
      { text: "أهلاً وسهلاً", lang: "Arabic" },
      { text: "வரவேற்கிறோம்", lang: "Tamil" },
      { text: "స్వాగతం", lang: "Telugu" },
      { text: "Willkommen", lang: "German" },
      { text: "欢迎", lang: "Chinese" },
    ],
    []
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Cycle through greetings
  useEffect(() => {
    if (showFinal) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= greetings.length - 1) {
          setShowFinal(true);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [greetings.length, showFinal]);

  // Confetti effect when showing final message
  useEffect(() => {
    if (showFinal) {
      // Fire confetti
      const duration = 2000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Redirect after animation
      const timeout = setTimeout(() => {
        router.push("/");
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [showFinal, router]);

  if (!isAuthenticated) return null;

  const currentGreeting = greetings[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a12]">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-[10%] h-[400px] w-[400px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute top-1/3 right-[10%] h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]" />
      </div>

      <div className="relative z-10 text-center px-4">
        <AnimatePresence mode="wait">
          {!showFinal ? (
            <motion.div
              key={currentGreeting.text}
              initial={{ opacity: 0, y: 20, scale: 0.95, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold bg-gradient-to-r from-white via-sky-200 to-fuchsia-200 bg-clip-text text-transparent">
                {currentGreeting.text}
              </h1>
              <p className="mt-4 text-lg text-white/50">{currentGreeting.lang}</p>
            </motion.div>
          ) : (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center"
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Welcome message */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-white"
              >
                Welcome to DevMatch
              </motion.h1>

              {/* Username */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5 text-yellow-400" />
                <span className="text-xl text-white/80">
                  Ready to go,{" "}
                  <span className="font-semibold bg-gradient-to-r from-sky-400 to-fuchsia-400 bg-clip-text text-transparent">
                    {user?.username}
                  </span>
                </span>
                <Sparkles className="h-5 w-5 text-yellow-400" />
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-white/50 max-w-md"
              >
                Your account is ready. Let&apos;s discover repos, connect with recruiters, and build something great.
              </motion.p>

              {/* Loading indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 flex items-center gap-3"
              >
                <div className="h-2 w-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-400" />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-4 text-sm text-white/40"
              >
                Redirecting to home...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}