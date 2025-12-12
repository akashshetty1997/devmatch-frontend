/**
 * @file src/pages/login.tsx
 * @description Login page (clean, modern, dark-mode safe)
 */

import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const redirect = (router.query.redirect as string) || "/";
      router.push(redirect);
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f14]">


      <div className="px-4 py-12">
        <div className="mx-auto w-full max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: branding */}
            <div className="hidden lg:block">
              <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/15 dark:bg-[#0f1623]">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  DevMatch
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-white/65">
                  Sign in to manage your profile, post jobs, and connect with
                  developers and recruiters.
                </p>

                <div className="mt-6 grid gap-3">
                  <FeatureRow
                    title="Developer profiles"
                    desc="Showcase skills, repos, and posts."
                  />
                  <FeatureRow
                    title="Recruiter tools"
                    desc="Post roles and track applications."
                  />
                  <FeatureRow
                    title="Dark-mode safe UI"
                    desc="Readable, clean, and consistent."
                  />
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    New here?
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-white/65">
                    Create an account in under a minute.
                  </p>
                  <Link
                    href="/register"
                    className="mt-3 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: auth card */}
            <div>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/15 dark:bg-[#0f1623]">
                <div className="p-6 sm:p-8 border-b border-gray-200 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                        Sign in
                      </h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-white/65">
                        Use your email and password.
                      </p>
                    </div>

                    <Link
                      href="/"
                      className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                      title="Back to home"
                    >
                      Home
                    </Link>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <LoginForm />

                  <div className="mt-6 flex flex-col gap-2 text-sm">
                    <div className="text-gray-600 dark:text-white/65">
                      Don&apos;t have an account?{" "}
                      <Link
                        href="/register"
                        className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                      >
                        Sign up
                      </Link>
                    </div>

                    <div className="text-gray-600 dark:text-white/65">
                      Forgot password?{" "}
                      <Link
                        href="/forgot-password"
                        className="font-semibold text-blue-700 hover:underline dark:text-blue-300"
                      >
                        Reset it
                      </Link>
                    </div>
                  </div>

                  {/* Mobile-only: small brand header */}
                  <div className="mt-8 lg:hidden">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                        DevMatch
                      </p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-white/65">
                        Profiles • Jobs • Repos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal */}
              <p className="mt-4 text-xs text-gray-500 dark:text-white/45">
                By signing in, you agree to the Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center dark:border-white/15 dark:bg-[#0f1623]">
        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {title}
        </p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-white/65">
          {desc}
        </p>
      </div>
    </div>
  );
}
