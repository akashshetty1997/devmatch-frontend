/**
 * @file src/components/details/RepoReadme.tsx
 * @description Repository README display with AI summary + markdown (dark/glass)
 */

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  FiFileText,
  FiZap,
  FiChevronDown,
  FiChevronUp,
  FiCopy,
} from "react-icons/fi";
import { Button } from "@/components/common";
import toast from "react-hot-toast";

interface RepoReadmeProps {
  readme: string | null;
  aiSummary: string | null;
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md",
        "shadow-[0_28px_120px_-90px_rgba(0,0,0,0.95)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  meta,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-white">
        <span className="text-white/70">{icon}</span>
        <h3 className="font-semibold tracking-tight">{title}</h3>
      </div>
      {meta ? <div className="text-xs text-white/50">{meta}</div> : null}
    </div>
  );
}

function CodeBlock({
  code,
  languageLabel,
}: {
  code: string;
  languageLabel?: string;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="group relative">
      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {languageLabel ? (
          <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[11px] text-white/70">
            {languageLabel}
          </span>
        ) : null}

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-white/80 hover:bg-white/[0.1]"
          title="Copy code"
        >
          <FiCopy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>

      <pre className="mb-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/90">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

export default function RepoReadme({ readme, aiSummary }: RepoReadmeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const maxLength = 3200;

  const { displayContent, showToggle } = useMemo(() => {
    if (!readme) return { displayContent: "", showToggle: false };

    const needsTruncate = readme.length > maxLength;
    if (!needsTruncate) return { displayContent: readme, showToggle: false };

    if (isExpanded) return { displayContent: readme, showToggle: true };

    return {
      displayContent: readme.substring(0, maxLength) + "\n\n...",
      showToggle: true,
    };
  }, [readme, isExpanded]);

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {aiSummary ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlassCard className="p-5 sm:p-6">
            <div className="mb-4">
              <SectionTitle
                icon={<FiZap className="h-5 w-5 text-cyan-200" />}
                title="AI Summary"
                meta={<span className="text-white/40">Generated</span>}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-sm sm:text-[15px] leading-relaxed text-white/80 whitespace-pre-wrap">
                {aiSummary}
              </p>
            </div>
          </GlassCard>
        </motion.div>
      ) : null}

      {/* README */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.16, 1, 0.3, 1],
          delay: 0.05,
        }}
      >
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle
              icon={<FiFileText className="h-5 w-5" />}
              title="README"
              meta={
                readme ? (
                  <span>
                    {readme.length.toLocaleString()} chars
                    {showToggle ? (
                      <span className="text-white/35"> • truncated</span>
                    ) : null}
                  </span>
                ) : (
                  <span>No content</span>
                )
              }
            />

            {readme ? (
              <Button
                variant="outline"
                className="border-white/15 text-white hover:bg-white/10"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(readme);
                    toast.success("README copied");
                  } catch {
                    toast.error("Copy failed");
                  }
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <FiCopy className="h-4 w-4" />
                  Copy
                </span>
              </Button>
            ) : null}
          </div>

          {readme ? (
            <div className="readme-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                  h1: ({ children }) => (
                    <h1 className="mt-7 mb-4 border-b border-white/10 pb-3 text-2xl font-bold text-white">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-7 mb-3 border-b border-white/10 pb-3 text-xl font-bold text-white">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 mb-2 text-lg font-semibold text-white">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="mt-5 mb-2 text-base font-semibold text-white">
                      {children}
                    </h4>
                  ),

                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-white/80">
                      {children}
                    </p>
                  ),

                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-200 hover:text-cyan-100 underline decoration-white/20 hover:decoration-white/40 underline-offset-4"
                    >
                      {children}
                    </a>
                  ),

                  ul: ({ children }) => (
                    <ul className="mb-4 list-inside list-disc space-y-1 text-white/80">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 list-inside list-decimal space-y-1 text-white/80">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-white/80">{children}</li>
                  ),

                  code: ({ className, children }) => {
                    const isInline = !className;
                    if (isInline) {
                      return (
                        <code className="rounded-lg border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-white/90">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="font-mono text-sm text-white/90">
                        {children}
                      </code>
                    );
                  },

                  // ✅ FIX: DO NOT spread <pre> props onto a <div>.
                  // We return our own wrapper and style; no ref mismatch.
                  pre: ({ children }) => {
                    const child: any = Array.isArray(children)
                      ? children[0]
                      : children;

                    const cls: string | undefined = child?.props?.className;
                    const lang =
                      typeof cls === "string" && cls.includes("language-")
                        ? cls.replace("language-", "")
                        : undefined;

                    const raw =
                      typeof child?.props?.children === "string"
                        ? child.props.children
                        : Array.isArray(child?.props?.children)
                        ? child.props.children.join("")
                        : "";

                    return <CodeBlock code={raw} languageLabel={lang} />;
                  },

                  blockquote: ({ children }) => (
                    <blockquote className="my-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white/75">
                      <div className="border-l-2 border-cyan-300/50 pl-4 italic">
                        {children}
                      </div>
                    </blockquote>
                  ),

                  table: ({ children }) => (
                    <div className="mb-5 overflow-x-auto rounded-2xl border border-white/10">
                      <table className="min-w-full">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-white/[0.04]">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-white/10 px-4 py-2 text-left text-sm font-semibold text-white">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-white/5 px-4 py-2 text-sm text-white/80">
                      {children}
                    </td>
                  ),

                  hr: () => <hr className="my-7 border-white/10" />,

                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src || ""}
                      alt={alt || ""}
                      className="my-5 h-auto max-w-full rounded-2xl border border-white/10"
                      loading="lazy"
                    />
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-white/80">{children}</em>
                  ),
                }}
              >
                {displayContent}
              </ReactMarkdown>

              {showToggle ? (
                <button
                  type="button"
                  onClick={() => setIsExpanded((v) => !v)}
                  className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/[0.08]"
                >
                  {isExpanded ? (
                    <>
                      <FiChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <FiChevronDown className="h-4 w-4" />
                      Show more
                    </>
                  )}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-white/60">
                No README available for this repository.
              </p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
