/**
 * @file src/pages/register.tsx
 * @description Register page with site features highlight
 */

import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterForm } from "@/components/auth";
import { FiGithub, FiUsers, FiBriefcase, FiZap } from "react-icons/fi";

const features = [
  {
    icon: FiGithub,
    title: "Showcase Your Repos",
    description: "Import and highlight your best GitHub projects",
  },
  {
    icon: FiBriefcase,
    title: "Find Opportunities",
    description: "Connect with recruiters looking for your skills",
  },
  {
    icon: FiUsers,
    title: "Build Your Network",
    description: "Follow developers, share posts, and grow together",
  },
  {
    icon: FiZap,
    title: "AI-Powered Matching",
    description: "Get matched with jobs that fit your expertise",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) router.push("/");
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f14]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* LEFT: Branding & Features */}
          <div className="order-2 lg:order-1">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/25">
                  D
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    DevMatch
                  </div>
                  <div className="text-sm text-gray-500 dark:text-white/50">
                    Where developers get discovered
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="mt-8">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Your code deserves
                  <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    to be seen
                  </span>
                </h2>
                <p className="mt-3 text-gray-600 dark:text-white/60">
                  Join thousands of developers showcasing their work and
                  connecting with top recruiters.
                </p>
              </div>

              {/* Features */}
              <div className="mt-8 grid gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/5"
                  >
                    <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-white/50">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social proof */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 border-2 border-white dark:border-[#0b0f14]"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-white/60">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      1,000+
                    </span>{" "}
                    developers already joined
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                  Create your account
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-white/60">
                  Build your profile, share repos, and connect with recruiters.
                </p>
              </div>

              <RegisterForm />

              <div className="mt-6 text-xs text-gray-500 dark:text-white/45">
                By continuing, you agree to basic platform rules (no spam, no
                harassment).
              </div>
            </div>
          </div>
        </div>

        {/* subtle footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
