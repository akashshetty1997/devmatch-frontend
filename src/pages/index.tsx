/**
 * @file src/pages/index.tsx
 * @description Aesthetic, high-polish Home page (Next.js pages router) with scroll effects + animations
 *
 * Requires:
 * - framer-motion
 * - lucide-react
 * - tailwindcss
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle,
  ChevronDown,
  Clock,
  Code,
  ExternalLink,
  Github,
  Globe,
  MapPin,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { jobService } from "@/services/jobService";
import { githubService } from "@/services/githubService";

// Types
interface Job {
  _id: string;
  title: string;
  companyName: string;
  location?: { city?: string; country?: string };
  workType: string;
  createdAt: string;
}

interface TrendingRepo {
  _id?: string;
  id?: number;
  githubId?: number;
  name: string;
  fullName?: string;
  full_name?: string;
  owner?: { login?: string } | string;
  description: string | null;
  stars?: number;
  stargazers_count?: number;
  language?: string | null;
  primaryLanguage?: string | null;
}

/* ---------------------------- Motion helpers ---------------------------- */

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
} satisfies Variants;

const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.55, ease: "easeOut" } },
} satisfies Variants;

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
} satisfies Variants;

const cardIn = {
  hidden: { opacity: 0, y: 18, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} satisfies Variants;

function AnimatedSection({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        // overflow-hidden prevents inner content from spilling on tiny widths
        "overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_1px_0_0_rgba(255,255,255,0.05)_inset]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
      {/* max-w-full ensures pill doesn't push layout */}
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}

/* ------------------------------- Page ------------------------------- */

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();

  // Page scroll progress (top progress bar)
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 22,
    mass: 0.25,
  });

  // Hero scroll parallax
  const heroRef = useRef<HTMLElement | null>(null);
  const heroScroll = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  }).scrollYProgress;

  const heroOpacity = useTransform(heroScroll, [0, 0.75, 1], [1, 0.7, 0.1]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 0.96]);
  const heroY = useTransform(heroScroll, [0, 1], [0, 90]);

  // Data
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [trendingRepos, setTrendingRepos] = useState<TrendingRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;

    const run = async () => {
      hasFetched.current = true;
      setLoading(true);

      try {
        const [jobsRes, reposRes] = await Promise.allSettled([
          jobService.getFeaturedJobs(3),
          githubService.getTrending({ limit: 3 }),
        ]);

        if (jobsRes.status === "fulfilled") {
          const jobsData =
            (jobsRes.value as any)?.data?.data ?? (jobsRes.value as any)?.data;
          const jobs: Job[] = Array.isArray(jobsData)
            ? jobsData
            : Array.isArray(jobsData?.jobs)
            ? jobsData.jobs
            : [];
          setRecentJobs(jobs);
        }

        if (reposRes.status === "fulfilled") {
          const reposData =
            (reposRes.value as any)?.data?.data ??
            (reposRes.value as any)?.data;
          const repos: TrendingRepo[] = Array.isArray(reposData)
            ? reposData
            : Array.isArray(reposData?.repos)
            ? reposData.repos
            : [];
          setTrendingRepos(repos);
        }
      } catch (e) {
        console.error("Failed to fetch homepage data:", e);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const getRepoFullName = (repo: TrendingRepo): string => {
    if (repo.fullName) return repo.fullName;
    if (repo.full_name) return repo.full_name;
    const owner = typeof repo.owner === "string" ? repo.owner : repo.owner?.login;
    if (owner && repo.name) return `${owner}/${repo.name}`;
    return repo.name || "";
  };

  const getRepoStars = (repo: TrendingRepo): number =>
    repo.stars ?? repo.stargazers_count ?? 0;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return `${Math.floor(diffDays / 7)} weeks ago`;
  };

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight - 80, behavior: "smooth" });
  };

  const features = useMemo(
    () => [
      {
        title: "Explore repos that matter",
        desc: "Search GitHub. Save, review, and discuss repos with signals that help you choose fast.",
        icon: Code,
        bullets: ["GitHub search + trending", "Favorites + bookmarks", "AI summaries (optional)"],
        accent: "from-sky-500/20 to-cyan-500/10",
      },
      {
        title: "Jobs without the noise",
        desc: "Curated listings and a clean flow. Recruiters post. Developers apply and track.",
        icon: Briefcase,
        bullets: ["Featured listings", "Simple apply flow", "Application tracking"],
        accent: "from-fuchsia-500/20 to-purple-500/10",
      },
      {
        title: "Network, not vanity",
        desc: "Profiles that show real work. Posts, comments, and direct messages built for momentum.",
        icon: Users,
        bullets: ["Developer profiles", "Social feed", "Direct messages"],
        accent: "from-emerald-500/20 to-lime-500/10",
      },
    ],
    []
  );

  const testimonials = useMemo(
    () => [
      {
        name: "Recruiter",
        quote: "The UI is clean and the repo signals save time. It feels focused, not bloated.",
        tag: "Hiring",
      },
      {
        name: "Developer",
        quote: "Trending + search + details in one place. No context switching. That's the win.",
        tag: "Discovery",
      },
      {
        name: "Student",
        quote: "The layout makes it obvious what to do next. The motion is subtle, not distracting.",
        tag: "Onboarding",
      },
    ],
    []
  );

  return (
    <div className="relative overflow-hidden bg-[#070A12] text-white">
      {/* Top progress bar */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 top-0 z-[60] h-[2px] w-full origin-left bg-gradient-to-r from-sky-400 via-fuchsia-400 to-emerald-400"
      />

      {/* Subtle background texture */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.35]">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute top-[20%] left-[10%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute top-[55%] right-[8%] h-[460px] w-[460px] rounded-full bg-emerald-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.07)_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      {/* Top banner */}
      <div className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 text-sm text-white/70">
            {/* min-w-0 + truncate prevents overflow on small widths */}
            <div className="truncate">
              <span className="font-medium text-white/90">Team:</span> Akash Shridhar Shetty &amp;
              Skandhan Madhusudhana
              <span className="mx-2 text-white/30">|</span>
              Section 05
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap gap-3">
            <a
              href="https://github.com/akashshetty1997/devmatch-frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
            >
              <Github size={16} className="flex-shrink-0" />
              <span className="min-w-0 truncate">Frontend</span>
              <ExternalLink size={12} className="flex-shrink-0 text-white/50" />
            </a>
            <a
              href="https://github.com/akashshetty1997/devmatch-backend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/85 hover:bg-white/10"
            >
              <Github size={16} className="flex-shrink-0" />
              <span className="min-w-0 truncate">Backend</span>
              <ExternalLink size={12} className="flex-shrink-0 text-white/50" />
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 md:pb-16 md:pt-16">
          <motion.div
            style={reduceMotion ? undefined : { opacity: heroOpacity, scale: heroScale, y: heroY }}
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="relative"
          >
            {/* Glass hero shell */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] backdrop-blur-md md:p-10">
              {/* corner glow */}
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl" />

              <div className="grid items-center gap-10 md:grid-cols-12">
                {/* Left */}
                <div className="min-w-0 md:col-span-7">
                  <motion.div variants={fadeUp} className="mb-5 flex min-w-0 flex-wrap gap-2">
                    <Pill>
                      <Zap size={16} className="text-yellow-300 flex-shrink-0" />
                      <span className="truncate">Developer Platform</span>
                    </Pill>
                    <Pill>
                      <Sparkles size={16} className="text-sky-300 flex-shrink-0" />
                      <span className="truncate">Connect With Recruiter</span>
                    </Pill>
                    <Pill>
                      <TrendingUp size={16} className="text-emerald-300 flex-shrink-0" />
                      <span className="truncate">Live content</span>
                    </Pill>
                  </motion.div>

                  {isAuthenticated && user ? (
                    <>
                      <motion.h1
                        variants={fadeUp}
                        className="text-4xl font-semibold leading-tight md:text-6xl"
                      >
                        Hey,{" "}
                        <span className="bg-gradient-to-r from-white via-sky-200 to-fuchsia-200 bg-clip-text text-transparent break-words">
                          {user.username}
                        </span>
                        .
                      </motion.h1>
                      <motion.p variants={fadeUp} className="mt-4 text-lg text-white/70 md:text-xl">
                        {user.role === "DEVELOPER"
                          ? "Discover repos and opportunities with less noise and better signals."
                          : "Find candidates faster with profiles that show real work."}
                      </motion.p>

                      <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/search"
                          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                        >
                          <Search size={18} className="flex-shrink-0" />
                          <span className="truncate">Search Repos</span>
                          <ArrowRight
                            size={18}
                            className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>

                        <Link
                          href={user.role === "DEVELOPER" ? "/jobs" : "/my-jobs"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                        >
                          <Briefcase size={18} className="flex-shrink-0" />
                          <span className="truncate">
                            {user.role === "DEVELOPER" ? "Browse Jobs" : "Manage Jobs"}
                          </span>
                        </Link>
                      </motion.div>
                    </>
                  ) : (
                    <>
                      <motion.h1
                        variants={fadeUp}
                        className="text-4xl font-semibold leading-tight md:text-6xl"
                      >
                        Where{" "}
                        <span className="bg-gradient-to-r from-white via-sky-200 to-fuchsia-200 bg-clip-text text-transparent">
                          code
                        </span>{" "}
                        meets{" "}
                        <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-fuchsia-200 bg-clip-text text-transparent">
                          opportunity
                        </span>
                        .
                      </motion.h1>

                      <motion.p variants={fadeUp} className="mt-4 text-lg text-white/70 md:text-xl">
                        Discover repositories, connect with recruiters, and land your next role — with a UI
                        designed to keep you moving.
                      </motion.p>

                      <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href="/register"
                          className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                        >
                          <span className="truncate">Get Started Free</span>
                          <ArrowRight
                            size={18}
                            className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>

                        <Link
                          href="/login"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                        >
                          <span className="truncate">Sign In</span>
                        </Link>
                      </motion.div>

                      <motion.div variants={fadeUp} className="mt-10 grid grid-cols-3 gap-6">
                        {[
                          { label: "Active Developers", value: "10K+" },
                          { label: "Jobs Posted", value: "500+" },
                          { label: "Repos Explored", value: "50K+" },
                        ].map((s) => (
                          <div
                            key={s.label}
                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
                          >
                            <div className="text-2xl font-semibold truncate">{s.value}</div>
                            <div className="mt-1 text-xs text-white/60 truncate">{s.label}</div>
                          </div>
                        ))}
                      </motion.div>
                    </>
                  )}
                </div>

                {/* Right: "Bento preview" */}
                <div className="min-w-0 md:col-span-5">
                  <motion.div variants={fade} className="grid min-w-0 gap-4">
                    <GlassCard className="p-5">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0 text-sm font-semibold text-white/90 truncate">
                          Trending Repos
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-300">
                          Live
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {[
                          { name: "vercel/next.js", stars: "128k", lang: "TypeScript" },
                          { name: "facebook/react", stars: "231k", lang: "JavaScript" },
                          { name: "denoland/deno", stars: "98k", lang: "Rust" },
                        ].map((repo) => (
                          <div
                            key={repo.name}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3"
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/40 to-fuchsia-500/20">
                              <Github size={16} className="text-white/80" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white/90">
                                {repo.name}
                              </div>
                              <div className="truncate text-xs text-white/50">{repo.lang}</div>
                            </div>

                            <div className="flex flex-shrink-0 items-center gap-1 text-xs text-yellow-300">
                              <Star size={12} />
                              {repo.stars}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <div className="grid min-w-0 grid-cols-2 gap-4">
                      <GlassCard className="p-5">
                        <div className="truncate text-sm font-semibold text-white/90">Quick Search</div>
                        <div className="mt-3 flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
                          <Search size={12} className="flex-shrink-0 text-white/40" />
                          <span className="min-w-0 truncate">react hooks...</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                          <Zap size={12} className="flex-shrink-0 text-sky-400" />
                          <span className="truncate">Instant results</span>
                        </div>
                      </GlassCard>

                      <GlassCard className="p-5">
                        <div className="truncate text-sm font-semibold text-white/90">Active Jobs</div>
                        <div className="mt-3 flex min-w-0 items-center gap-2">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/30 to-sky-500/20">
                            <Briefcase size={14} className="text-white/70" />
                          </div>
                          <div className="min-w-0 truncate text-xs text-white/70">12 new today</div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                          <TrendingUp size={12} className="flex-shrink-0 text-emerald-400" />
                          <span className="truncate">Growing daily</span>
                        </div>
                      </GlassCard>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Scroll cue */}
            <motion.button
              type="button"
              onClick={scrollToContent}
              aria-label="Scroll to content"
              className="mx-auto mt-7 flex items-center gap-2 text-sm text-white/60 hover:text-white/85"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <ChevronDown size={18} />
              Scroll
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Marquee band */}
      <section className="relative z-10 border-y border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl overflow-hidden px-4 py-5">
          <motion.div
            className="flex gap-10 whitespace-nowrap text-sm text-white/70"
            animate={reduceMotion ? undefined : { x: ["0%", "-50%"] }}
            transition={reduceMotion ? undefined : { duration: 18, ease: "linear", repeat: Infinity }}
          >
            {[
              "Trending repos",
              "GitHub search",
              "Bookmarks",
              "Job listings",
              "Profiles",
              "Feed",
              "Reviews",
              "AI summaries",
              "Direct messages",
              "Fast filters",
              "Trending repos",
              "GitHub search",
              "Bookmarks",
              "Job listings",
              "Profiles",
              "Feed",
              "Reviews",
              "AI summaries",
              "Direct messages",
              "Fast filters",
            ].map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-white/40" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent jobs */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2 text-sm text-sky-300">
                  <Clock size={18} className="flex-shrink-0" />
                  <span className="truncate">Fresh opportunities</span>
                </div>
                <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Recent job postings</h2>
                <p className="mt-2 max-w-2xl text-white/65">
                  Clean cards, clear hierarchy, minimal noise. If there are no jobs, the empty state
                  still looks intentional.
                </p>
              </div>

              <Link
                href="/jobs"
                className="hidden flex-shrink-0 items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 md:inline-flex"
              >
                <span className="truncate">View all</span> <ArrowRight size={18} className="flex-shrink-0" />
              </Link>
            </div>
          </AnimatedSection>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : recentJobs.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-120px" }}
                variants={stagger}
                className="grid gap-5 md:grid-cols-3"
              >
                {recentJobs.map((job) => (
                  <motion.div key={job._id} variants={cardIn}>
                    <Link
                      href={`/jobs/${job._id}`}
                      className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/60 to-fuchsia-500/30 text-lg font-semibold">
                            {(job.companyName?.charAt(0) || "C").toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-white/60">{job.companyName}</div>
                            <div className="mt-1 truncate text-lg font-semibold text-white/95 group-hover:text-white">
                              {job.title}
                            </div>
                          </div>
                        </div>

                        <span className="flex-shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/65">
                          {formatTimeAgo(job.createdAt)}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {job.location?.city && (
                          <span className="inline-flex max-w-[180px] items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                            <MapPin size={12} className="flex-shrink-0" />
                            <span className="truncate">{job.location.city}</span>
                          </span>
                        )}
                        <span className="inline-flex max-w-[180px] items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                          <Briefcase size={12} className="flex-shrink-0" />
                          <span className="truncate">{job.workType}</span>
                        </span>
                      </div>

                      <div className="mt-5 flex min-w-0 items-center justify-between text-sm text-white/60">
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <CheckCircle size={16} className="flex-shrink-0 text-emerald-300" />
                          <span className="truncate">Quick apply flow</span>
                        </span>
                        <ArrowRight
                          size={18}
                          className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <Briefcase size={46} className="mx-auto text-white/25" />
                <div className="mt-4 text-white/80">No jobs posted yet.</div>
                <div className="mt-1 text-sm text-white/55">This space will populate automatically.</div>
              </div>
            )}

            <Link
              href="/jobs"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 md:hidden"
            >
              <span className="truncate">View all jobs</span> <ArrowRight size={18} className="flex-shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending repos */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 pb-16">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2 text-sm text-fuchsia-300">
                  <TrendingUp size={18} className="flex-shrink-0" />
                  <span className="truncate">Explore</span>
                </div>
                <h2 className="mt-2 text-3xl font-semibold md:text-4xl">Trending repositories</h2>
                <p className="mt-2 max-w-2xl text-white/65">
                  High contrast, soft gradients, and "quiet" motion. Cards lift on hover and the section
                  feels premium.
                </p>
              </div>

              <Link
                href="/search"
                className="hidden flex-shrink-0 items-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 md:inline-flex"
              >
                <span className="truncate">Search repos</span> <ArrowRight size={18} className="flex-shrink-0" />
              </Link>
            </div>
          </AnimatedSection>

          <div className="mt-10">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-44 rounded-2xl border border-white/10 bg-white/5 animate-pulse"
                  />
                ))}
              </div>
            ) : trendingRepos.length > 0 ? (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-120px" }}
                variants={stagger}
                className="grid gap-5 md:grid-cols-3"
              >
                {trendingRepos.map((repo, idx) => {
                  const fullName = getRepoFullName(repo);
                  const stars = getRepoStars(repo);
                  return (
                    <motion.div key={repo.githubId ?? repo.id ?? idx} variants={cardIn}>
                      <Link
                        // IMPORTANT: encodeURIComponent prevents URL break on "owner/repo"
                        href={`/details/${encodeURIComponent(fullName)}`}
                        className="group block overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/45 to-sky-500/20">
                              <Github size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-lg font-semibold text-white/95 group-hover:text-white">
                                {fullName}
                              </div>
                              <div className="mt-1 line-clamp-2 text-sm text-white/60 break-words">
                                {repo.description || "No description available"}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                            <Star size={14} className="text-yellow-300" />
                            {stars.toLocaleString()}
                          </div>
                        </div>

                        <div className="mt-5 flex min-w-0 items-center justify-between">
                          {repo.language || repo.primaryLanguage ? (
                            <span className="inline-flex max-w-[180px] items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-fuchsia-300" />
                              <span className="truncate">{repo.language || repo.primaryLanguage}</span>
                            </span>
                          ) : (
                            <span className="truncate text-xs text-white/50">Language unknown</span>
                          )}

                          <ArrowRight
                            size={18}
                            className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <Code size={46} className="mx-auto text-white/25" />
                <div className="mt-4 text-white/80">No trending repos yet.</div>
                <div className="mt-1 text-sm text-white/55">Search to discover repositories.</div>
              </div>
            )}

            <Link
              href="/search"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10 md:hidden"
            >
              <span className="truncate">Search repos</span> <ArrowRight size={18} className="flex-shrink-0" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features (bento) */}
      <section className="relative z-10 border-y border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <AnimatedSection className="text-center">
            <div className="mx-auto inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/80">
              <Sparkles size={16} className="flex-shrink-0 text-sky-300" />
              <span className="truncate">Why DevMatch?</span>
            </div>
            <h2 className="mt-4 text-3xl font-semibold md:text-5xl">Designed to feel premium</h2>
            <p className="mx-auto mt-3 max-w-2xl text-white/65">
              Bento layout, clear type hierarchy, subtle gradients, and motion that supports scanning —
              not distraction.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={stagger}
            className="mt-10 grid gap-5 md:grid-cols-12"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={cardIn} className="md:col-span-4">
                  <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-md">
                    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.accent}`} />
                    <div className="relative min-w-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10">
                          <Icon size={22} className="text-white/90" />
                        </div>
                        <div className="min-w-0 truncate text-lg font-semibold">{f.title}</div>
                      </div>
                      <p className="mt-4 text-sm text-white/65 line-clamp-3">{f.desc}</p>
                      <ul className="mt-5 space-y-2">
                        {f.bullets.map((b) => (
                          <li key={b} className="flex min-w-0 items-center gap-2 text-sm text-white/75">
                            <CheckCircle size={16} className="flex-shrink-0 text-emerald-300" />
                            <span className="min-w-0 truncate">{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-120px" }}
            variants={stagger}
            className="mt-12 grid gap-5 md:grid-cols-3"
          >
            {testimonials.map((t) => (
              <motion.div key={t.tag} variants={cardIn}>
                <div className="h-full overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur-md">
                  <div className="truncate text-xs text-white/55">{t.tag}</div>
                  <div className="mt-3 line-clamp-3 text-white/85">"{t.quote}"</div>
                  <div className="mt-5 truncate text-sm font-semibold text-white/85">{t.name}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="relative z-10">
          <div className="mx-auto max-w-7xl px-4 py-16">
            <AnimatedSection>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md md:p-12">
                <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/15 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-emerald-400/12 blur-3xl" />

                <div className="relative grid gap-10 md:grid-cols-12 md:items-center">
                  <div className="min-w-0 md:col-span-8">
                    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm text-white/80">
                      <Globe size={16} className="flex-shrink-0 text-fuchsia-300" />
                      <span className="truncate">Ready to level up?</span>
                    </div>

                    <h3 className="mt-4 text-3xl font-semibold md:text-4xl">
                      Create an account and start building momentum
                    </h3>
                    <p className="mt-3 max-w-2xl text-white/65">
                      This CTA is intentionally simple: one primary action, one secondary action, and
                      zero clutter.
                    </p>
                  </div>

                  <div className="flex-shrink-0 md:col-span-4 md:justify-self-end">
                    <div className="flex flex-col gap-3">
                      <Link
                        href="/register"
                        className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90"
                      >
                        <span className="truncate">Create Free Account</span>
                        <ArrowRight
                          size={18}
                          className="flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                        />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 hover:bg-white/10"
                      >
                        <span className="truncate">Sign In</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 truncate text-sm text-white/60">
              DevMatch — minimal, fast, scroll-polished UI.
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link href="/search" className="text-white/70 hover:text-white">
                Search
              </Link>
              <Link href="/jobs" className="text-white/70 hover:text-white">
                Jobs
              </Link>
              <Link href="/developers" className="text-white/70 hover:text-white">
                Developers
              </Link>
              <Link href="/register" className="text-white/70 hover:text-white">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
