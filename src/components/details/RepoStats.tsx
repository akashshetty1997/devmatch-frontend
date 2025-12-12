/**
 * @file src/components/details/RepoStats.tsx
 * @description Repository statistics cards (redesigned + dark mode safe)
 */

"use client";

import {
  FiStar,
  FiGitBranch,
  FiEye,
  FiAlertCircle,
  FiCode,
} from "react-icons/fi";
import { Card, CardBody } from "@/components/common";
import { formatNumber } from "@/lib/utils";

interface RepoStatsProps {
  repo: {
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    language: string | null;
    languages?: { name: string; percentage: number }[];
  };
}

// Keep your mapping, just used for dots/bars. (No tailwind dynamic class generation here.)
const languageColors: Record<string, string> = {
  JavaScript: "bg-yellow-400",
  TypeScript: "bg-blue-500",
  Python: "bg-green-500",
  Java: "bg-red-500",
  Go: "bg-cyan-400",
  Rust: "bg-orange-500",
  "C++": "bg-pink-500",
  "C#": "bg-purple-500",
  Ruby: "bg-red-600",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-400",
  Kotlin: "bg-purple-400",
  HTML: "bg-orange-600",
  CSS: "bg-blue-400",
  Shell: "bg-green-400",
};

function StatTile({
  label,
  value,
  Icon,
  iconClassName,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}) {
  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]">
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-500 dark:text-white/55">
          {label}
        </div>
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition-colors dark:bg-white/[0.06] ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {formatNumber(value)}
      </div>

      <div className="mt-1 text-xs text-gray-400 dark:text-white/40">
        Updated from GitHub
      </div>
    </div>
  );
}

export default function RepoStats({ repo }: RepoStatsProps) {
  const stats = [
    {
      label: "Stars",
      value: repo.stars,
      icon: FiStar,
      iconClassName: "text-yellow-500",
    },
    {
      label: "Forks",
      value: repo.forks,
      icon: FiGitBranch,
      iconClassName: "text-blue-500",
    },
    {
      label: "Watchers",
      value: repo.watchers,
      icon: FiEye,
      iconClassName: "text-emerald-500",
    },
    {
      label: "Open issues",
      value: repo.openIssues,
      icon: FiAlertCircle,
      iconClassName: "text-rose-500",
    },
  ];

  const hasLanguages =
    Array.isArray(repo.languages) && repo.languages.length > 0;

  return (
    <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <CardBody className="p-5">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <StatTile
              key={s.label}
              label={s.label}
              value={s.value}
              Icon={s.icon}
              iconClassName={s.iconClassName}
            />
          ))}
        </div>

        {/* Languages */}
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <FiCode className="h-4 w-4 text-gray-400 dark:text-white/45" />
              Languages
            </div>

            {!hasLanguages && repo.language && (
              <div className="text-xs text-gray-500 dark:text-white/55">
                Primary:{" "}
                <span className="font-medium text-gray-700 dark:text-white/80">
                  {repo.language}
                </span>
              </div>
            )}
          </div>

          {hasLanguages ? (
            <>
              {/* Progress bar */}
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                <div className="flex h-full w-full">
                  {repo.languages!.map((lang) => (
                    <div
                      key={lang.name}
                      className={`${
                        languageColors[lang.name] || "bg-gray-400"
                      } h-full`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, lang.percentage)
                        )}%`,
                      }}
                      title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {repo.languages!.slice(0, 8).map((lang) => (
                  <div key={lang.name} className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        languageColors[lang.name] || "bg-gray-400"
                      }`}
                    />
                    <span className="text-gray-700 dark:text-white/80">
                      {lang.name}
                    </span>
                    <span className="text-gray-400 dark:text-white/45">
                      {lang.percentage.toFixed(1)}%
                    </span>
                  </div>
                ))}

                {repo.languages!.length > 8 && (
                  <span className="text-sm text-gray-500 dark:text-white/55">
                    +{repo.languages!.length - 8} more
                  </span>
                )}
              </div>
            </>
          ) : repo.language ? (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
              <span
                className={`h-3 w-3 rounded-full ${
                  languageColors[repo.language] || "bg-gray-400"
                }`}
              />
              <span className="font-medium text-gray-800 dark:text-white/85">
                {repo.language}
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/55">
              Language data not available.
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
