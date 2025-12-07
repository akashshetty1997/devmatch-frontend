/**
 * @file src/pages/profile/[username].tsx
 * @description Profile page - uses ProfileContainer component
 */

import { useRouter } from "next/router";
import Head from "next/head";
import { ProfileContainer } from "@/components/profile";

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;

  // Wait for router to be ready
  if (!router.isReady || !username || typeof username !== "string") {
    return null;
  }

  return (
    <>
      <Head>
        <title>{username} | DevMatch</title>
        <meta name="description" content={`${username}'s profile on DevMatch`} />
      </Head>
      <ProfileContainer username={username} />
    </>
  );
}