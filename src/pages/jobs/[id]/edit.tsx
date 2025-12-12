/**
 * @file src/pages/jobs/[id]/edit.tsx
 * @description Edit job page - allows recruiters to edit their job postings
 */

import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import { useAuthStore } from "@/store/authStore";
import JobForm from "@/components/jobs/JobForm";
import { PageLoading } from "@/components/common";

export default function EditJobPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Redirect if not authenticated or not a recruiter/admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/jobs/${id}/edit`);
    } else if (
      !isLoading &&
      isAuthenticated &&
      user?.role !== "RECRUITER" &&
      user?.role !== "ADMIN"
    ) {
      router.push("/jobs");
    }
  }, [isLoading, isAuthenticated, user, router, id]);

  // Show loading while checking auth
  if (isLoading || !isAuthenticated) {
    return <PageLoading />;
  }

  // Don't render form until we have the job ID
  if (!id || typeof id !== "string") {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>Edit Job | DevMatch</title>
        <meta name="description" content="Edit your job posting on DevMatch" />
      </Head>
      <JobForm jobId={id} />
    </>
  );
}