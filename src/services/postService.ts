/**
 * @file src/services/postService.ts
 * @description API service for posts/feed functionality
 */

import api from "./api";

export const postService = {
  // Get feed posts
  getFeed: (params?: { page?: number; limit?: number }) => {
    return api.get("/posts", { params });
  },

  // Get posts by user
  getUserPosts: (
    username: string,
    params?: { page?: number; limit?: number }
  ) => {
    return api.get(`/posts/user/${username}`, { params });
  },

  // Get single post
  getPost: (postId: string) => {
    return api.get(`/posts/${postId}`);
  },

  // Create post
  createPost: (data: {
    content: string;
    type?: "TEXT" | "SHARE_REPO" | "SHARE_JOB";
    repoId?: string;
    jobPostId?: string;
  }) => {
    return api.post("/posts", data);
  },

  // Update post
  updatePost: (postId: string, data: { content: string }) => {
    return api.put(`/posts/${postId}`, data);
  },

  // Delete post
  deletePost: (postId: string) => {
    return api.delete(`/posts/${postId}`);
  },

  // Like post - Updated to use consistent endpoint
  likePost: (postId: string) => {
    return api.post(`/posts/${postId}/likes`);
  },

  // Unlike post - Fixed endpoint to match likes endpoint
  unlikePost: (postId: string) => {
    return api.delete(`/posts/${postId}/likes`);
  },

  // Get comments for post - Simplified without params for now
  getComments: (postId: string, params?: { page?: number; limit?: number }) => {
    return api.get(`/posts/${postId}/comments`, { params });
  },

  // Add comment to post - Simplified method signature
  addComment: (postId: string, content: string) => {
    return api.post(`/posts/${postId}/comments`, { content });
  },

  // Delete comment
  deleteComment: (postId: string, commentId: string) => {
    return api.delete(`/posts/${postId}/comments/${commentId}`);
  },

  // Report post
  reportPost: (postId: string, reason: string) => {
    return api.post(`/posts/${postId}/report`, { reason });
  },
};
