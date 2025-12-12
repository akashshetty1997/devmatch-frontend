/**
 * @file src/pages/details/[...slug].tsx
 * @description Repository details page - wrapper + premium loading shell
 */

import { useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";
import { Github, Loader2 } from "lucide-react";
import { DetailsContainer } from "@/components/details";

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
        "shadow-[0_20px_80px_-60px_rgba(0,0,0,0.9)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="relative min-h-[70vh]">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[10%] h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -top-28 right-[12%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-44 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px] opacity-40" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75">
            <Github size={16} className="text-white/70" />
            Repository details
          </div>

          <div className="mt-4 h-9 w-[320px] rounded-xl bg-white/10 animate-pulse" />
          <div className="mt-3 h-4 w-[520px] rounded-lg bg-white/10 animate-pulse" />
        </div>

        {/* Main loading card */}
        <GlassCard className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="h-6 w-[260px] rounded-lg bg-white/10 animate-pulse" />
              <div className="h-4 w-[420px] rounded-lg bg-white/10 animate-pulse" />
              <div className="flex gap-2 pt-2">
                <div className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
                <div className="h-7 w-24 rounded-full bg-white/10 animate-pulse" />
                <div className="h-7 w-28 rounded-full bg-white/10 animate-pulse" />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-white/80"
            >
              <Loader2 className="animate-spin" size={18} />
              Loading repository…
            </motion.div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-56 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="h-56 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default function RepoDetailsPage() {
  const router = useRouter();
  const { slug } = router.query;

  const repoFullName = useMemo(() => {
    if (!slug) return null;
    return Array.isArray(slug) ? slug.join("/") : slug;
  }, [slug]);

  if (!router.isReady || !repoFullName) {
    return (
      <>
        <Head>
          <title>Repository Details | DevMatch</title>
          <meta
            name="description"
            content="View repository details on DevMatch"
          />
        </Head>
        <LoadingShell />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{repoFullName} | DevMatch</title>
        <meta
          name="description"
          content={`View repository details for ${repoFullName} on DevMatch`}
        />
      </Head>

      {/* Keep DetailsContainer untouched; it renders the real UI */}
      <DetailsContainer repoId={repoFullName} />
    </>
  );
}
