/**
 * @file src/components/details/RepoComments.tsx
 * @description Repository comments section
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FiSend, FiTrash2, FiUser } from "react-icons/fi";
import { Card, CardBody, Avatar, Button, Textarea } from "@/components/common";
import { formatRelativeTime } from "@/lib/utils";

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
}

interface RepoCommentsProps {
  comments: Comment[];
  isAuthenticated: boolean;
  currentUserId?: string;
  onSubmit: (content: string) => Promise<void>;
  onDelete: (commentId: string) => void;
}

export default function RepoComments({
  comments,
  isAuthenticated,
  currentUserId,
  onSubmit,
  onDelete,
}: RepoCommentsProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent("");
    } catch (err) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {isAuthenticated ? (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts about this repository..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={!content.trim()}
                  leftIcon={<FiSend />}
                >
                  Post Comment
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="text-center py-8">
            <FiUser className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Sign in to join the discussion</p>
            <Link href="/login">
              <Button>Sign In</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">
            Discussion ({comments.length})
          </h3>
          {comments.map((comment, index) => (
            <motion.div
              key={comment._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardBody>
                  <div className="flex items-start gap-4">
                    <Link href={`/profile/${comment.author.username}`}>
                      <Avatar
                        src={comment.author.avatar}
                        name={comment.author.username}
                        size="md"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${comment.author.username}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {comment.author.username}
                          </Link>
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>

                        {/* Delete button (own comments only) */}
                        {currentUserId === comment.author._id && (
                          <button
                            onClick={() => onDelete(comment._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-gray-500">
              No comments yet. Start the discussion!
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
