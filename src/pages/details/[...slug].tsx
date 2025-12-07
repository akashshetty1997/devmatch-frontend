/**
 * @file src/pages/details/[id].tsx
 * @description Repository details page - shows GitHub repo info + local data
 */

import { useRouter } from "next/router";
import Head from "next/head";
import { DetailsContainer } from "@/components/details";

export default function RepoDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  // Wait for router to be ready
  if (!router.isReady || !id || typeof id !== "string") {
    return null;
  }

  return (
    <>
      <Head>
        <title>Repository Details | DevMatch</title>
        <meta name="description" content="View repository details on DevMatch" />
      </Head>
      <DetailsContainer repoId={id} />
    </>
  );
}