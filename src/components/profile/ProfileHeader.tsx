/**
 * @file src/components/profile/ProfileHeader.tsx
 * @description Profile header with avatar, name, stats
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiLink,
  FiCalendar,
  FiEdit2,
  FiSettings,
  FiUserPlus,
  FiUserCheck,
  FiGithub,
  FiLinkedin,
  FiTwitter,
  FiBriefcase,
  FiCheckCircle,
} from 'react-icons/fi';
import { Avatar, Button, Badge } from '@/components/common';
import { formatDate } from '@/lib/utils';
import EditProfileModal from './EditProfileModal';

interface ProfileHeaderProps {
  user: {
    _id: string;
    username: string;
    email?: string;
    role: string;
    avatar: string | null;
    createdAt: string;
  };
  profile: any;
  stats: {
    followers: number;
    following: number;
    posts: number;
    repos?: number;
    jobs?: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollow: () => void;
}

export default function ProfileHeader({
  user,
  profile,
  stats,
  isOwnProfile,
  isFollowing,
  onFollow,
}: ProfileHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  const isDeveloper = user.role === 'DEVELOPER';
  const isRecruiter = user.role === 'RECRUITER';

  // Get location string
  const getLocation = () => {
    if (!profile?.location) return null;
    const parts = [];
    if (profile.location.city) parts.push(profile.location.city);
    if (profile.location.state) parts.push(profile.location.state);
    if (profile.location.country) parts.push(profile.location.country);
    return parts.join(', ') || null;
  };

  const location = getLocation();

  return (
    <>
      {/* Cover Image */}
      <div className="h-32 sm:h-48 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700" />

      {/* Profile Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 sm:-mt-20 pb-6 border-b border-gray-200 bg-white rounded-t-3xl sm:rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 px-4 sm:px-6">
            {/* Left: Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <Avatar
                  src={user.avatar}
                  name={user.username}
                  size="xl"
                  className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-white shadow-lg"
                />
                {isRecruiter && profile?.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1.5">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                )}
              </motion.div>

              {/* Name & Info */}
              <div className="text-center sm:text-left pb-2">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {user.username}
                  </h1>
                  <Badge
                    variant={isDeveloper ? 'primary' : 'success'}
                    size="sm"
                  >
                    {isDeveloper ? 'Developer' : 'Recruiter'}
                  </Badge>
                </div>

                {/* Headline */}
                {(profile?.headline || profile?.positionTitle) && (
                  <p className="text-gray-600 mb-2">
                    {profile.headline || `${profile.positionTitle} at ${profile.companyName}`}
                  </p>
                )}

                {/* Meta Info */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-sm text-gray-500">
                  {location && (
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-4 h-4" />
                      {location}
                    </span>
                  )}
                  {profile?.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-blue-600"
                    >
                      <FiLink className="w-4 h-4" />
                      Portfolio
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-4 h-4" />
                    Joined {formatDate(user.createdAt)}
                  </span>
                </div>

                {/* Social Links */}
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
                  {profile?.githubUsername && (
                    <a
                      href={`https://github.com/${profile.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <FiGithub className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <FiLinkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile?.twitterUrl && (
                    <a
                      href={profile.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FiTwitter className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions & Stats */}
            <div className="flex flex-col items-center sm:items-end gap-4">
              {/* Action Buttons */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="outline"
                      leftIcon={<FiEdit2 />}
                      onClick={() => setShowEditModal(true)}
                    >
                      Edit Profile
                    </Button>
                    <Link href="/settings">
                      <Button variant="ghost" className="p-2">
                        <FiSettings className="w-5 h-5" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? 'outline' : 'primary'}
                      leftIcon={isFollowing ? <FiUserCheck /> : <FiUserPlus />}
                      onClick={onFollow}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-center">
                <Link href={`/profile/${user.username}/followers`} className="hover:opacity-80">
                  <div className="text-xl font-bold text-gray-900">{stats.followers}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </Link>
                <Link href={`/profile/${user.username}/following`} className="hover:opacity-80">
                  <div className="text-xl font-bold text-gray-900">{stats.following}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </Link>
                {isDeveloper && stats.repos !== undefined && (
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stats.repos}</div>
                    <div className="text-sm text-gray-500">Repos</div>
                  </div>
                )}
                {isRecruiter && stats.jobs !== undefined && (
                  <div>
                    <div className="text-xl font-bold text-gray-900">{stats.jobs}</div>
                    <div className="text-sm text-gray-500">Jobs</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Open to Work / Hiring Badge */}
          {isDeveloper && profile?.isOpenToWork && (
            <div className="mx-4 sm:mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <FiBriefcase className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">Open to work</span>
              {profile.preferredWorkTypes?.length > 0 && (
                <span className="text-green-600 text-sm">
                  • {profile.preferredWorkTypes.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          profile={profile}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}