/**
 * @file src/components/common/Navbar.tsx
 * @description Dark premium navbar (matches Home page bg-[#070A12])
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import {
  Menu,
  X,
  Search,
  Briefcase,
  Users,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  Sparkles,
} from "lucide-react";

const pop = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.98,
    transition: { duration: 0.14, ease: "easeIn" },
  },
} satisfies Variants;

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.12, ease: "easeIn" } },
} satisfies Variants;

function useOnClickOutside(
  refs: Array<React.RefObject<HTMLElement | null>>,
  handler: () => void
) {
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (refs.some((r) => r.current && r.current.contains(target))) return;
      handler();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [refs, handler]);
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, isLoading } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileRef = useRef<HTMLDivElement | null>(null);

  useOnClickOutside([userMenuRef], () => setUserMenuOpen(false));
  useOnClickOutside([mobileRef], () => setMobileOpen(false));

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const navLinks = useMemo(
    () => [
      { href: "/jobs", label: "Jobs", icon: Briefcase },
      { href: "/developers", label: "Developers", icon: Users },
      { href: "/search", label: "Search Repos", icon: Search },
      { href: "/feed", label: "Feed", icon: MessageSquare },
    ],
    []
  );

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/70 backdrop-blur-md">
      <div className="h-[1px] w-full bg-gradient-to-r from-sky-400/50 via-fuchsia-400/35 to-emerald-400/35" />

      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <span className="absolute inset-0 bg-gradient-to-br from-sky-500/25 via-fuchsia-500/15 to-emerald-500/10" />
              <Sparkles size={16} className="relative text-white/85" />
            </span>
            <span className="text-base font-semibold tracking-tight text-white/90 group-hover:text-white">
              DevMatch
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-white" : "text-white/70 hover:text-white",
                  ].join(" ")}
                >
                  <Icon
                    size={16}
                    className={active ? "text-sky-300" : "text-white/55"}
                  />
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-[6px] h-[2px] rounded-full bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="h-9 w-9 rounded-full bg-white/10 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="group inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/85 hover:bg-white/10"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-sky-500/60 to-fuchsia-500/30 text-sm font-semibold text-white">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[140px] truncate font-medium">
                    {user.username}
                  </span>
                  <ChevronDown
                    size={16}
                    className={[
                      "text-white/55 transition-transform",
                      userMenuOpen ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      variants={pop}
                      className="absolute right-0 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#070A12]/95 shadow-[0_30px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-md"
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="text-sm font-semibold text-white/90">
                          @{user.username}
                        </div>
                        <div className="mt-0.5 text-xs text-white/55">
                          {user.email}
                        </div>
                      </div>

                      <div className="py-2">
                        <NavItem href="/profile" icon={User} label="Profile" />
                        {user.role === "RECRUITER" && (
                          <NavItem
                            href="/my-jobs"
                            icon={Briefcase}
                            label="My Jobs"
                          />
                        )}
                        {user.role === "DEVELOPER" && (
                          <NavItem
                            href="/my-applications"
                            icon={Briefcase}
                            label="My Applications"
                          />
                        )}
                        {user.role === "ADMIN" && (
                          <NavItem
                            href="/admin"
                            icon={Shield}
                            label="Admin Dashboard"
                          />
                        )}
                        <NavItem
                          href="/settings"
                          icon={Settings}
                          label="Settings"
                        />
                      </div>

                      <div className="border-t border-white/10 p-2">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-white/85 hover:bg-white/10"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={mobileRef}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fade}
              className="md:hidden pb-4"
            >
              <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
                <div className="p-2">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={[
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium",
                          active
                            ? "bg-white/10 text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon
                          size={18}
                          className={active ? "text-sky-300" : "text-white/55"}
                        />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>

                {!isAuthenticated && !isLoading && (
                  <div className="border-t border-white/10 p-3">
                    <div className="grid gap-2">
                      <Link
                        href="/login"
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-semibold text-white/85 hover:bg-white/10"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        className="rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold hover:bg-white/90"
                        style={{ color: '#000000' }}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
    >
      <Icon size={16} className="text-white/55" />
      {label}
    </Link>
  );
}
