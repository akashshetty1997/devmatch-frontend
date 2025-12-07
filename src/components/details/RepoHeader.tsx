/**
 * @file src/components/details/RepoHeader.tsx
 * @description Repository header with name, description, actions
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FiGithub,
  FiExternalLink,
  FiStar,
  FiBookmark,
  FiShare2,
  FiArrowLeft,
} from 'react-icons/fi';
import { Button, Badge } from '@/components/common';
import toast from 'react-hot-toast';

interface RepoHeaderProps {
  repo: {
    name: string;
    fullName: string;
    description: string | null;
    htmlUrl: string;
    ownerLogin: string;
    topics: string[];
  };
  avgRating: number;
  reviewCount: number;
  isPinned: boolean;
  onPin: () => void;
  isAuthenticated: boolean;
  isDeveloper: boolean;
}

export default function RepoHeader({
  repo,
  avgRating,
  reviewCount,
  isPinned,
  onPin,
  isAuthenticated,
  isDeveloper,
}: RepoHeaderProps) {
  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: repo.fullName,
          text: repo.description || 'Check out this repository on DevMatch',
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  // Render stars
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Link */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
        >
          {/* Left: Repo Info */}
          <div className="flex-1 min-w-0">
            {/* Owner / Repo Name */}
            <div className="flex items-center gap-2 mb-2">
              <a
                href={`https://github.com/${repo.ownerLogin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                {repo.ownerLogin}
              </a>
              <span className="text-gray-400">/</span>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {repo.name}
              </h1>
            </div>

            {/* Description */}
            {repo.description && (
              <p className="text-gray-600 mb-4 max-w-3xl">{repo.description}</p>
            )}

            {/* Topics */}
            {repo.topics && repo.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {repo.topics.map((topic) => (
                  <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`}>
                    <Badge variant="primary" size="sm" className="hover:bg-blue-200">
                      {topic}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Rating Summary */}
            {reviewCount > 0 && (
              <div className="flex items-center gap-3">
                {renderStars(avgRating)}
                <span className="text-gray-700 font-medium">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-gray-500">
                  ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap gap-3">
            {/* View on GitHub */}
            <a href={repo.htmlUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" leftIcon={<FiGithub />}>
                View on GitHub
                <FiExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>

            {/* Pin to Profile (Developer only) */}
            {isAuthenticated && isDeveloper && (
              <Button
                variant={isPinned ? 'primary' : 'outline'}
                leftIcon={<FiBookmark className={isPinned ? 'fill-current' : ''} />}
                onClick={onPin}
              >
                {isPinned ? 'Pinned' : 'Pin to Profile'}
              </Button>
            )}

            {/* Share */}
            <Button variant="ghost" className="p-2" onClick={handleShare}>
              <FiShare2 className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}