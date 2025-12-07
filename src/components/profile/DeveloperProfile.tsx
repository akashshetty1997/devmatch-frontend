/**
 * @file src/components/profile/DeveloperProfile.tsx
 * @description Developer-specific profile content
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiGithub, FiStar, FiGitBranch, FiExternalLink, FiCode } from 'react-icons/fi';
import { developerAPI, postAPINew } from '@/lib/api';
import { Card, CardBody, CardHeader, Badge, SkillBadge, CardSkeleton } from '@/components/common';
import { formatNumber } from '@/lib/utils';
import ProfileTabs from './ProfileTabs';

interface DeveloperProfileProps {
  profile: any;
  user: any;
  isOwnProfile: boolean;
}

export default function DeveloperProfile({ profile, user, isOwnProfile }: DeveloperProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [repos, setRepos] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reposRes, postsRes] = await Promise.all([
          developerAPI.getPinnedRepos(user._id).catch(() => ({ data: { data: [] } })),
          postAPINew.getByUser(user._id, 1, 5).catch(() => ({ data: { data: { posts: [] } } })),
        ]);
        setRepos(reposRes.data.data || []);
        setPosts(postsRes.data.data?.posts || []);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user._id]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'repos', label: 'Repositories' },
    { id: 'posts', label: 'Posts' },
    { id: 'reviews', label: 'Reviews' },
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Left Column - Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* About */}
        {profile?.bio && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">About</h3>
            </CardHeader>
            <CardBody>
              <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
            </CardBody>
          </Card>
        )}

        {/* Skills */}
        {profile?.skills?.length > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Skills</h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <SkillBadge key={skill}>{skill}</SkillBadge>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Experience */}
        {profile?.yearsOfExperience > 0 && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Experience</h3>
            </CardHeader>
            <CardBody>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {profile.yearsOfExperience}+
              </div>
              <p className="text-gray-500">Years of Experience</p>
            </CardBody>
          </Card>
        )}

        {/* GitHub Stats */}
        {profile?.githubUsername && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">GitHub</h3>
              <a
                href={`https://github.com/${profile.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600"
              >
                <FiExternalLink className="w-4 h-4" />
              </a>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-3">
                <FiGithub className="w-8 h-8 text-gray-700" />
                <div>
                  <p className="font-medium text-gray-900">@{profile.githubUsername}</p>
                  <p className="text-sm text-gray-500">Connected</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Profile Completeness - Only for own profile */}
        {isOwnProfile && profile?.profileCompleteness !== undefined && (
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Profile Strength</h3>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completeness</span>
                <span className="font-semibold text-gray-900">{profile.profileCompleteness}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${profile.profileCompleteness}%` }}
                />
              </div>
              {profile.profileCompleteness < 100 && (
                <p className="text-sm text-gray-500 mt-2">
                  Complete your profile to attract more recruiters!
                </p>
              )}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Right Column - Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Pinned Repos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pinned Repositories</h3>
                {loading ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </div>
                ) : repos.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {repos.slice(0, 6).map((repo) => (
                      <RepoCard key={repo._id} repo={repo} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardBody className="text-center py-8">
                      <FiCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No pinned repositories yet</p>
                      {isOwnProfile && (
                        <Link href="/search" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
                          Search and pin repos
                        </Link>
                      )}
                    </CardBody>
                  </Card>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard key={post._id} post={post} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardBody className="text-center py-8">
                      <p className="text-gray-500">No posts yet</p>
                    </CardBody>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'repos' && (
            <ProfileTabs username={user.username} isOwnProfile={isOwnProfile} tab="repos" />
          )}

          {activeTab === 'posts' && (
            <ProfileTabs username={user.username} isOwnProfile={isOwnProfile} tab="posts" />
          )}

          {activeTab === 'reviews' && (
            <ProfileTabs username={user.username} isOwnProfile={isOwnProfile} tab="reviews" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Repo Card Component
function RepoCard({ repo }: { repo: any }) {
  const languageColors: Record<string, string> = {
    JavaScript: 'bg-yellow-400',
    TypeScript: 'bg-blue-500',
    Python: 'bg-green-500',
    Java: 'bg-red-500',
    Go: 'bg-cyan-400',
    Rust: 'bg-orange-500',
  };

  return (
    <Link href={`/details/${repo._id}`}>
      <Card hover className="h-full">
        <CardBody>
          <h4 className="font-semibold text-gray-900 mb-2 truncate">{repo.name}</h4>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {repo.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            {repo.language && (
              <span className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded-full ${languageColors[repo.language] || 'bg-gray-400'}`} />
                {repo.language}
              </span>
            )}
            <span className="flex items-center gap-1">
              <FiStar className="w-4 h-4" />
              {formatNumber(repo.stars || 0)}
            </span>
            <span className="flex items-center gap-1">
              <FiGitBranch className="w-4 h-4" />
              {formatNumber(repo.forks || 0)}
            </span>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}

// Post Card Component
function PostCard({ post }: { post: any }) {
  return (
    <Card>
      <CardBody>
        <p className="text-gray-700 line-clamp-3">{post.content}</p>
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <span>❤️ {post.likesCount || 0}</span>
          <span>💬 {post.commentsCount || 0}</span>
        </div>
      </CardBody>
    </Card>
  );
}