/**
 * @file src/components/profile/RecruiterProfile.tsx
 * @description Recruiter-specific profile content - Reddit-ish, clean, dark-mode safe (FIXED)
 *
 * Fixes:
 * - Correct pagination append bug (was using stale `jobs` state)
 * - Prevents setState after unmount
 * - Safer recruiter matching (supports recruiter as object / id / username)
 * - More robust response shape handling
 * - Adds missing deps (profileWebsite/companyName etc are memo deps already)
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiGlobe,
  FiMapPin,
  FiUsers,
  FiBriefcase,
  FiPlus,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { jobAPIOriginal } from "@/lib/api";
import { Card, CardBody, Badge, Button, CardSkeleton } from "@/components/common";
import { formatRelativeTime } from "@/lib/utils";

interface RecruiterProfileProps {
  profile: any;
  user: any;
  isOwnProfile: boolean;
}

export default function RecruiterProfile({
  profile,
  user,
  isOwnProfile,
}: RecruiterProfileProps) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const companyInitial = useMemo(() => {
    const n = profile?.companyName?.trim();
    return (n?.[0] || "C").toUpperCase();
  }, [profile?.companyName]);

  const companyDomain = useMemo(() => {
    const url = (profile?.companyWebsite || "").trim();
    if (!url) return "";
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
    }
  }, [profile?.companyWebsite]);

  const location = useMemo(() => {
    const parts = [
      profile?.location?.city,
      profile?.location?.state,
      profile?.location?.country,
    ].filter(Boolean);
    return parts.length ? parts.join(", ") : null;
  }, [profile?.location]);

  useEffect(() => {
    if (!user?._id && !user?.username) {
      setLoading(false);
      setJobs([]);
      return;
    }

    let alive = true;

    const normalizeList = (res: any) => {
      const d = res?.data?.data;
      const list = d?.jobs ?? d ?? [];
      return Array.isArray(list) ? list : [];
    };

    const matchesRecruiter = (job: any) => {
      const rec = job?.recruiter;

      // recruiter might be: {_id, username}, or string id, or username (depending on backend)
      const recId = rec?._id ?? (typeof rec === "string" ? rec : undefined);
      const recUsername =
        rec?.username ?? (typeof rec === "string" ? rec : undefined);

      if (user?._id && recId) return recId === user._id;
      if (user?.username && recUsername) return recUsername === user.username;

      return false;
    };

    const fetchJobs = async () => {
      try {
        setLoading(true);

        if (isOwnProfile) {
          const res = await jobAPIOriginal.getMyJobs({});
          if (!alive) return;
          setJobs(normalizeList(res));
          return;
        }

        // Public view: backend has no filter, so we fetch all then filter client-side.
        const res = await jobAPIOriginal.getAll({});
        const all = normalizeList(res);
        const filtered = all.filter(matchesRecruiter);

        if (!alive) return;
        setJobs(filtered);
      } catch (err) {
        console.error("Failed to fetch jobs:", err);
        if (!alive) return;
        setJobs([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      alive = false;
    };
  }, [user?._id, user?.username, isOwnProfile]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* LEFT */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03] overflow-hidden">
          <div className="h-14 bg-gradient-to-r from-blue-600 to-purple-700" />

          <CardBody className="p-4">
            <div className="-mt-10 flex items-end justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-md border border-gray-200 flex items-center justify-center dark:bg-black/30 dark:border-white/10">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-extrabold">
                    {companyInitial}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-extrabold text-gray-900 dark:text-white">
                    {profile?.companyName || "Company"}
                  </h3>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {profile?.industry ? (
                      <Badge
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-700 dark:border-white/10 dark:text-white/70"
                      >
                        {profile.industry}
                      </Badge>
                    ) : null}

                    {profile?.companySize ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                        <FiUsers className="h-4 w-4" />
                        {profile.companySize} employees
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-2">
                {profile?.isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-200">
                    <FiCheckCircle className="h-4 w-4" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/70">
                    <FiAlertCircle className="h-4 w-4" />
                    Unverified
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {profile?.companyWebsite ? (
                <a
                  href={profile.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75 dark:hover:bg-white/[0.06]"
                >
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <FiGlobe className="h-4 w-4 text-gray-400 dark:text-white/45" />
                    <span className="truncate">{companyDomain || "Website"}</span>
                  </span>
                  <span className="text-xs text-gray-400 group-hover:text-gray-500 dark:text-white/35">
                    Open
                  </span>
                </a>
              ) : null}

              {location ? (
                <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/75">
                  <FiMapPin className="mt-0.5 h-4 w-4 text-gray-400 dark:text-white/45" />
                  <span className="min-w-0">{location}</span>
                </div>
              ) : null}
            </div>

            {profile?.companyDescription ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-white/45">
                  About
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-white/65">
                  {profile.companyDescription}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        {isOwnProfile ? (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardBody className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Hiring now?
                  </p>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-white/60">
                    Post a job to start receiving applications.
                  </p>
                </div>
                <Link href="/jobs/create" className="shrink-0">
                  <Button leftIcon={<FiPlus />}>Post</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>

      {/* RIGHT */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Job Postings{" "}
              {!loading ? (
                <span className="text-sm font-semibold text-gray-500 dark:text-white/45">
                  ({jobs.length})
                </span>
              ) : null}
            </h3>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-white/55">
              {isOwnProfile
                ? "Manage your listings and track interest."
                : "Open roles posted by this recruiter."}
            </p>
          </div>

          {isOwnProfile ? (
            <Link href="/jobs/create">
              <Button leftIcon={<FiPlus />}>New Job</Button>
            </Link>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
              >
                <JobRow job={job} isOwnProfile={isOwnProfile} />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]">
            <CardBody className="py-12 text-center">
              <FiBriefcase className="mx-auto h-12 w-12 text-gray-300 dark:text-white/20" />
              <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
                {isOwnProfile ? "No job postings yet" : "No active job postings"}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
                {isOwnProfile
                  ? "Create your first listing to start receiving applications."
                  : "Check back later."}
              </p>
              {isOwnProfile ? (
                <div className="mt-4">
                  <Link href="/jobs/create">
                    <Button>Post Your First Job</Button>
                  </Link>
                </div>
              ) : null}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- Job Row -------------------------------- */

function JobRow({ job, isOwnProfile }: { job: any; isOwnProfile: boolean }) {
  const place =
    job.location?.city ||
    job.location?.country ||
    job.location?.state ||
    "Remote";

  return (
    <Link href={`/jobs/${job._id}`} className="block">
      <Card
        hover
        className="border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
      >
        <CardBody className="p-0">
          <div className="flex gap-3 p-4">
            <div className="flex w-12 shrink-0 flex-col items-center justify-start rounded-xl bg-gray-50 py-2 text-xs font-semibold text-gray-600 dark:bg-white/[0.04] dark:text-white/60">
              <FiBriefcase className="h-4 w-4 text-gray-500 dark:text-white/55" />
              <span className="mt-1">{job.workType || "Role"}</span>

              {isOwnProfile ? (
                <>
                  <span className="mt-2 text-[11px] text-gray-500 dark:text-white/45">
                    apps
                  </span>
                  <span className="text-[11px]">{job.applicationCount || 0}</span>
                </>
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-sm font-extrabold text-gray-900 dark:text-white">
                      {job.title}
                    </h4>

                    {!job.isActive ? (
                      <Badge variant="warning" size="sm">
                        Inactive
                      </Badge>
                    ) : null}

                    {job.isFeatured ? (
                      <Badge variant="primary" size="sm">
                        Featured
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-white/50">
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin className="h-4 w-4" />
                      {place}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <FiBriefcase className="h-4 w-4" />
                      {job.workType}
                    </span>
                    <span>{formatRelativeTime(job.createdAt)}</span>
                  </div>
                </div>

                {isOwnProfile ? (
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-extrabold text-gray-900 dark:text-white">
                      {job.applicationCount || 0}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      Applications
                    </p>
                  </div>
                ) : null}
              </div>

              {job.requiredSkills?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.requiredSkills.slice(0, 6).map((skill: string) => (
                    <Badge
                      key={skill}
                      variant="default"
                      size="sm"
                      className="bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-white/70"
                    >
                      {skill}
                    </Badge>
                  ))}
                  {job.requiredSkills.length > 6 ? (
                    <Badge
                      variant="default"
                      size="sm"
                      className="bg-gray-100 text-gray-700 dark:bg-white/[0.06] dark:text-white/70"
                    >
                      +{job.requiredSkills.length - 6}
                    </Badge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
