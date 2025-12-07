/**
 * @file src/components/details/RepoSidebar.tsx
 * @description Repository details sidebar
 */

'use client';

import { FiGithub, FiLink, FiCalendar, FiGitBranch, FiTag, FiCopy, FiCheck } from 'react-icons/fi';
import { useState } from 'react';
import { Card, CardBody, CardHeader, Badge } from '@/components/common';
import { formatDate } from '@/lib/utils';

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

  const handleCopyClone = () => {
    navigator.clipboard.writeText(repo.cloneUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 sticky top-24">
      {/* Clone URL */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FiGitBranch className="w-4 h-4" />
            Clone
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={repo.cloneUrl}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg truncate"
            />
            <button
              onClick={handleCopyClone}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {copied ? (
                <FiCheck className="w-4 h-4 text-green-500" />
              ) : (
                <FiCopy className="w-4 h-4" />
              )}
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Repository Info */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">About</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* License */}
          {repo.license && (
            <div className="flex items-center gap-3">
              <FiTag className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">License</p>
                <p className="font-medium text-gray-900">{repo.license}</p>
              </div>
            </div>
          )}

          {/* Default Branch */}
          <div className="flex items-center gap-3">
            <FiGitBranch className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Default Branch</p>
              <p className="font-medium text-gray-900">{repo.defaultBranch}</p>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-center gap-3">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(repo.githubCreatedAt)}</p>
            </div>
          </div>

          {/* Last Updated */}
          <div className="flex items-center gap-3">
            <FiCalendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium text-gray-900">{formatDate(repo.githubUpdatedAt)}</p>
            </div>
          </div>

          {/* GitHub Link */}
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <FiGithub className="w-4 h-4" />
            View on GitHub
          </a>
        </CardBody>
      </Card>

      {/* AI Tech Stack */}
      {repo.aiTechStack && repo.aiTechStack.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Tech Stack</h3>
            <span className="text-xs text-gray-500">AI Generated</span>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2">
              {repo.aiTechStack.map((tech) => (
                <Badge key={tech} variant="primary" size="sm">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Last Synced */}
      <p className="text-xs text-gray-400 text-center">
        Data synced {formatDate(repo.lastSyncedAt)}
      </p>
    </div>
  );
}