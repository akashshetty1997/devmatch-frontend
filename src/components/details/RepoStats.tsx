/**
 * @file src/components/details/RepoStats.tsx
 * @description Repository statistics cards
 */

"use client";

import { FiStar, FiGitBranch, FiEye, FiAlertCircle } from "react-icons/fi";
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

export default function RepoStats({ repo }: RepoStatsProps) {
  const stats = [
    {
      label: "Stars",
      value: repo.stars,
      icon: FiStar,
      color: "text-yellow-500",
    },
    {
      label: "Forks",
      value: repo.forks,
      icon: FiGitBranch,
      color: "text-blue-500",
    },
    {
      label: "Watchers",
      value: repo.watchers,
      icon: FiEye,
      color: "text-green-500",
    },
    {
      label: "Issues",
      value: repo.openIssues,
      icon: FiAlertCircle,
      color: "text-red-500",
    },
  ];

  return (
    <Card>
      <CardBody>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 ${stat.color} mb-2`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(stat.value)}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Languages Bar */}
        {repo.languages && repo.languages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Languages
            </h4>

            {/* Progress Bar */}
            <div className="h-3 rounded-full overflow-hidden flex mb-3">
              {repo.languages.map((lang) => (
                <div
                  key={lang.name}
                  className={`${languageColors[lang.name] || "bg-gray-400"}`}
                  style={{ width: `${lang.percentage}%` }}
                  title={`${lang.name}: ${lang.percentage.toFixed(1)}%`}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {repo.languages.slice(0, 6).map((lang) => (
                <div key={lang.name} className="flex items-center gap-1.5">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      languageColors[lang.name] || "bg-gray-400"
                    }`}
                  />
                  <span className="text-gray-700">{lang.name}</span>
                  <span className="text-gray-400">
                    {lang.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single Language */}
        {!repo.languages?.length && repo.language && (
          <div className="flex items-center gap-2">
            <span
              className={`w-4 h-4 rounded-full ${
                languageColors[repo.language] || "bg-gray-400"
              }`}
            />
            <span className="font-medium text-gray-700">{repo.language}</span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
