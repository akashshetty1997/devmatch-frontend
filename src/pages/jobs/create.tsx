/**
 * @file src/pages/jobs/create.tsx
 * @description Create new job page - allows recruiters to post new jobs
 */

import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import { useAuthStore } from "@/store/authStore";
import JobForm from "@/components/jobs/JobForm";
import { PageLoading } from "@/components/common";

export default function CreateJobPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  // Redirect if not authenticated or not a recruiter/admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/jobs/create");
    } else if (
      !isLoading &&
      isAuthenticated &&
      user?.role !== "RECRUITER" &&
      user?.role !== "ADMIN"
    ) {
      router.push("/jobs");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading while checking auth
  if (isLoading || !isAuthenticated) {
    return <PageLoading />;
  }

  return (
    <>
      <Head>
        <title>Post a Job | DevMatch</title>
        <meta name="description" content="Post a new job listing on DevMatch" />
      </Head>
      <JobForm />
    </>
  );
}
