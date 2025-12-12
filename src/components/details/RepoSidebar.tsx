/**
 * @file src/components/details/RepoSidebar.tsx
 * @description Repository details sidebar (redesigned + dark mode safe)
 */

"use client";

import { useMemo, useState } from "react";
import {
  FiGithub,
  FiCalendar,
  FiGitBranch,
  FiTag,
  FiCopy,
  FiCheck,
  FiArrowLeft,
  FiTerminal,
  FiClock,
} from "react-icons/fi";
import { Card, CardBody, CardHeader, Badge, Button } from "@/components/common";
import { formatDate } from "@/lib/utils";

interface RepoSidebarProps {
  repo: {
    htmlUrl: string;
    cloneUrl: string;
    license: string | null;
    defaultBranch: string;
    aiTechStack?: string[];
    githubCreatedAt: string;
    githubUpdatedAt: string;
    lastSyncedAt: string;
  };
}

export default function RepoSidebar({ repo }: RepoSidebarProps) {
  const [copied, setCopied] = useState(false);

  const cloneLabel = useMemo(() => {
    try {
      const url = new URL(repo.cloneUrl);
      return url.hostname;
    } catch {
      return "Clone URL";
    }
  }, [repo.cloneUrl]);

  const handleCopyClone = async () => {
    try {
      await navigator.clipboard.writeText(repo.cloneUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleBack = () => {
    try {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "/search";
    } catch {
      window.location.href = "/search";
    }
  };

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Back */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800 dark:text-white/60 dark:hover:text-white"
      >
        <FiArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Quick actions */}
      <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <CardBody className="p-4">
          <div className="flex gap-2">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <Button
                variant="outline"
                className="w-full border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]"
                leftIcon={<FiGithub />}
              >
                GitHub
              </Button>
            </a>

            <Button
              variant="outline"
              onClick={handleCopyClone}
              className="border-gray-300 bg-transparent text-gray-800 hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/[0.06]"
              title="Copy clone URL"
            >
              {copied ? (
                <FiCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <FiCopy className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-white/60">
                <FiTerminal className="h-4 w-4" />
                <span>{cloneLabel}</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-white/50">
                {copied ? "Copied" : "Clone"}
              </span>
            </div>

            <div className="select-all truncate rounded-md bg-white px-3 py-2 font-mono text-xs text-gray-800 dark:bg-white/[0.06] dark:text-white/80">
              {repo.cloneUrl}
            </div>

            <div className="mt-2 text-xs text-gray-500 dark:text-white/50">
              git clone{" "}
              <span className="font-mono text-gray-700 dark:text-white/70">
                {repo.cloneUrl}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* About */}
      <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
        <CardHeader className="border-b border-gray-100 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            About
          </h3>
        </CardHeader>

        <CardBody className="p-4">
          <div className="space-y-4">
            {repo.license && (
              <MetaRow
                icon={<FiTag className="h-4 w-4" />}
                label="License"
                value={repo.license}
              />
            )}

            <MetaRow
              icon={<FiGitBranch className="h-4 w-4" />}
              label="Default branch"
              value={repo.defaultBranch || "main"}
              mono
            />

            <MetaRow
              icon={<FiCalendar className="h-4 w-4" />}
              label="Created"
              value={formatDate(repo.githubCreatedAt)}
            />

            <MetaRow
              icon={<FiCalendar className="h-4 w-4" />}
              label="Last updated"
              value={formatDate(repo.githubUpdatedAt)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Tech Stack */}
      {repo.aiTechStack && repo.aiTechStack.length > 0 && (
        <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          <CardHeader className="border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Tech Stack
              </h3>
              <span className="text-xs text-gray-500 dark:text-white/50">
                AI generated
              </span>
            </div>
          </CardHeader>

          <CardBody className="p-4">
            <div className="flex flex-wrap gap-2">
              {repo.aiTechStack.slice(0, 16).map((tech) => (
                <Badge
                  key={tech}
                  variant="primary"
                  size="sm"
                  className="dark:bg-blue-500/15 dark:text-blue-200"
                >
                  {tech}
                </Badge>
              ))}
              {repo.aiTechStack.length > 16 && (
                <span className="text-xs text-gray-500 dark:text-white/50">
                  +{repo.aiTechStack.length - 16} more
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Synced */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-white/40">
        <FiClock className="h-4 w-4" />
        <span>Synced {formatDate(repo.lastSyncedAt)}</span>
      </div>
    </aside>
  );
}

function MetaRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400 dark:text-white/35">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-white/50">
          {label}
        </p>
        <p
          className={`mt-0.5 break-words text-sm text-gray-900 dark:text-white/85 ${
            mono ? "font-mono" : "font-medium"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
