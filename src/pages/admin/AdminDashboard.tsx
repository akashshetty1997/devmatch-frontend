/**
 * @file src/pages/admin/AdminDashboard.tsx
 * @description Admin dashboard (clean, modern, dark-mode safe) - higher contrast cards
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/common/Loading";
import { adminService } from "../../services/adminService";
import {
  Users,
  Briefcase,
  Code,
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  UserCheck,
  UserX,
  Activity,
  Shield,
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    developers: number;
    recruiters: number;
    admins: number;
    newThisWeek: number;
    banned: number;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
    newThisWeek: number;
  };
  applications: {
    total: number;
    pending: number;
    thisWeek: number;
  };
  skills: {
    total: number;
    active: number;
    inactive: number;
  };
}

type RecentUser = {
  _id: string;
  username: string;
  email?: string;
  avatar: string | null;
  role: "DEVELOPER" | "RECRUITER" | "ADMIN" | string;
};

type RecentActivity = {
  type?: string;
  message?: string;
  createdAt?: string;
};

function safeNum(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}
function fmt(n: any) {
  return safeNum(n).toLocaleString();
}

function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/** Card surface that is actually visible in dark mode */
function CardShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        // light
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        // dark - higher contrast than your 0.03 opacity version
        "dark:border-white/15 dark:bg-[#0f1623] dark:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const statsRes = await adminService.getDashboardStats();
        const statsData = statsRes.data?.data || statsRes.data;

        if (!alive) return;
        setStats(statsData || null);

        try {
          const usersRes = await adminService.getRecentUsers(5);
          const usersData = usersRes.data?.data || usersRes.data;
          if (!alive) return;
          setRecentUsers((usersData?.users || usersData || []) as RecentUser[]);
        } catch {
          if (!alive) return;
          setRecentUsers([]);
        }

        try {
          const activityRes = await adminService.getRecentActivity(10);
          const activityData = activityRes.data?.data || activityRes.data;
          if (!alive) return;
          setRecentActivity(
            (activityData?.activities || activityData || []) as RecentActivity[]
          );
        } catch {
          if (!alive) return;
          setRecentActivity([]);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(
          e?.response?.data?.message || "Failed to load admin dashboard."
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const quickActions = useMemo(
    () => [
      {
        href: "/admin/users",
        title: "Manage Users",
        subtitle: "View & control access",
        Icon: Users,
      },
      {
        href: "/admin/skills",
        title: "Manage Skills",
        subtitle: "Add & edit skills",
        Icon: Code,
      },
      {
        href: "/admin/jobs",
        title: "Manage Jobs",
        subtitle: "Review job posts",
        Icon: Briefcase,
      },
      {
        href: "/admin/reports",
        title: "Reports",
        subtitle: "Flagged content",
        Icon: AlertTriangle,
      },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center bg-gray-50 px-4 dark:bg-[#0b0f14]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] bg-gray-50 px-4 py-10 dark:bg-[#0b0f14]">
        <div className="mx-auto max-w-3xl">
          <CardShell className="p-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Dashboard failed to load
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-white/65">
                  {error}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
                  >
                    Retry
                  </button>
                  <Link
                    href="/"
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </div>
          </CardShell>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-[#0b0f14]">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <CardShell className="mb-6 overflow-hidden">
          <div className="relative h-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 dark:from-[#1b3a7a] dark:via-[#2a1b6b] dark:to-[#3a145a]">
            <div className="pointer-events-none absolute inset-0 opacity-25 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-800 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
                    <Shield className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                    Admin Dashboard
                  </h1>
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-white/65">
                  Platform overview and management shortcuts.
                </p>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 sm:mt-0">
                <Link
                  href="/admin/users"
                  className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  Users
                </Link>
                <Link
                  href="/admin/reports"
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/15 dark:bg-white/5 dark:text-white/80 dark:hover:bg-white/10"
                >
                  Reports
                </Link>
              </div>
            </div>
          </div>
        </CardShell>

        {/* Quick actions */}
        <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(({ href, title, subtitle, Icon }) => (
            <Link key={href} href={href} className="group block">
              <CardShell className="p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:hover:bg-[#121c2d]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-800 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                        {title}
                      </p>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 dark:text-white/25 dark:group-hover:text-white/45" />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-white/65">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </CardShell>
            </Link>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Users"
            Icon={Users}
            primary={fmt(stats?.users?.total)}
            lines={[
              ["Developers", fmt(stats?.users?.developers)],
              ["Recruiters", fmt(stats?.users?.recruiters)],
              ["Admins", fmt(stats?.users?.admins)],
              ["Banned", fmt(stats?.users?.banned)],
            ]}
            footer={{
              icon: TrendingUp,
              text: `+${fmt(stats?.users?.newThisWeek)} this week`,
            }}
          />

          <StatCard
            title="Jobs"
            Icon={Briefcase}
            primary={fmt(stats?.jobs?.total)}
            lines={[
              ["Active", fmt(stats?.jobs?.active)],
              ["Inactive", fmt(stats?.jobs?.inactive)],
            ]}
            footer={{
              icon: TrendingUp,
              text: `+${fmt(stats?.jobs?.newThisWeek)} this week`,
            }}
          />

          <StatCard
            title="Applications"
            Icon={FileText}
            primary={fmt(stats?.applications?.total)}
            lines={[["Pending review", fmt(stats?.applications?.pending)]]}
            footer={{
              icon: TrendingUp,
              text: `+${fmt(stats?.applications?.thisWeek)} this week`,
            }}
          />

          <StatCard
            title="Skills"
            Icon={Code}
            primary={fmt(stats?.skills?.total)}
            lines={[
              ["Active", fmt(stats?.skills?.active)],
              ["Inactive", fmt(stats?.skills?.inactive)],
            ]}
            footer={{
              linkHref: "/admin/skills",
              linkText: "Manage skills",
            }}
          />
        </div>

        {/* Bottom: recent lists */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <CardShell className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Recent Users
              </h3>
              <Link
                href="/admin/users"
                className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
              >
                View all
              </Link>
            </div>

            {recentUsers.length ? (
              <div className="divide-y divide-gray-100 dark:divide-white/10">
                {recentUsers.map((u) => (
                  <div key={u._id} className="p-4">
                    <div className="flex items-center gap-3">
                      {u.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-extrabold text-white">
                          {u.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          @{u.username}
                        </p>
                        <p className="truncate text-sm text-gray-600 dark:text-white/65">
                          {u.email || "—"}
                        </p>
                      </div>

                      <RolePill role={u.role} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-600 dark:text-white/65">
                No recent users available.
              </div>
            )}
          </CardShell>

          {/* Recent Activity */}
          <CardShell className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-white/10">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <Activity className="h-5 w-5 text-gray-400 dark:text-white/35" />
            </div>

            {recentActivity.length ? (
              <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto dark:divide-white/10">
                {recentActivity.map((a, idx) => (
                  <div key={idx} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
                        <ActivityIcon type={a.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {a.message || "Activity"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-white/45">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-sm text-gray-600 dark:text-white/65">
                No recent activity available.
              </div>
            )}
          </CardShell>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- UI --------------------------------- */

function StatCard({
  title,
  Icon,
  primary,
  lines,
  footer,
}: {
  title: string;
  Icon: any;
  primary: string;
  lines: [string, string][];
  footer?: { icon: any; text: string } | { linkHref: string; linkText: string };
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-[#0f1623] dark:shadow-[0_10px_30px_-20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
          {title}
        </h3>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-700 dark:border-white/15 dark:bg-white/5 dark:text-white/80">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white">
        {primary}
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {lines.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between text-gray-600 dark:text-white/65"
          >
            <span>{k}</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {v}
            </span>
          </div>
        ))}
      </div>

      {footer ? (
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-white/10">
          {"icon" in footer ? (
            <div className="flex items-center gap-2 text-sm">
              <footer.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
              <span className="font-semibold text-emerald-700 dark:text-emerald-200">
                {footer.text}
              </span>
            </div>
          ) : (
            <Link
              href={footer.linkHref}
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
            >
              {footer.linkText} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const r = (role || "").toUpperCase();
  const cls =
    r === "DEVELOPER"
      ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200"
      : r === "RECRUITER"
      ? "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-500/25 dark:bg-purple-500/10 dark:text-purple-200"
      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-200";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cls}`}
    >
      {r || "USER"}
    </span>
  );
}

function ActivityIcon({ type }: { type?: string }) {
  const t = (type || "").toUpperCase();
  if (t === "USER_REGISTERED") return <UserCheck className="h-4 w-4" />;
  if (t === "USER_BANNED") return <UserX className="h-4 w-4" />;
  if (t === "JOB_POSTED") return <Briefcase className="h-4 w-4" />;
  if (t === "APPLICATION") return <FileText className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}
