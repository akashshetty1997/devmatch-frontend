/**
 * @file src/components/details/RepoReadme.tsx
 * @description Repository README display with AI summary
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FiFileText, FiZap, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { Card, CardBody, CardHeader } from "@/components/common";

interface RepoReadmeProps {
  readme: string | null;
  aiSummary: string | null;
}

export default function RepoReadme({ readme, aiSummary }: RepoReadmeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Simple markdown-like rendering (basic)
  const renderContent = (content: string) => {
    // Remove HTML tags for safety
    const sanitized = content.replace(/<[^>]*>/g, "");

    // Limit content if not expanded
    const maxLength = 2000;
    const shouldTruncate = sanitized.length > maxLength && !isExpanded;
    const displayContent = shouldTruncate
      ? sanitized.substring(0, maxLength) + "..."
      : sanitized;

    return (
      <>
        <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm leading-relaxed">
          {displayContent}
        </pre>
        {sanitized.length > maxLength && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            {isExpanded ? (
              <>
                <FiChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <FiChevronDown className="w-4 h-4" />
                Show More
              </>
            )}
          </button>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {aiSummary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="border-blue-100">
              <div className="flex items-center gap-2 text-blue-700">
                <FiZap className="w-5 h-5" />
                <h3 className="font-semibold">AI Summary</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
            </CardBody>
          </Card>
        </motion.div>
      )}

      {/* README */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">README</h3>
          </div>
        </CardHeader>
        <CardBody>
          {readme ? (
            renderContent(readme)
          ) : (
            <p className="text-gray-500 text-center py-8">
              No README available for this repository.
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
