/**
 * @file src/services/userService.ts
 * @description API service for user account management
 */

import api from "./api";

export const userService = {
  // ==================== PROFILE ====================

  // Get current user
  getMe: () => {
    return api.get("/users/me");
  },

  // Update basic user info
  updateMe: (data: { username?: string; avatar?: string }) => {
    return api.put("/users/me", data);
  },

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Delete avatar
  deleteAvatar: () => {
    return api.delete("/users/me/avatar");
  },

  // ==================== ACCOUNT SETTINGS ====================

  // Change password
  changePassword: (currentPassword: string, newPassword: string) => {
    return api.put("/users/me/password", { currentPassword, newPassword });
  },

  // Change email
  changeEmail: (newEmail: string, password: string) => {
    return api.put("/users/me/email", { newEmail, password });
  },

  // Update privacy settings
  updatePrivacySettings: (settings: {
    profilePublic?: boolean;
    showEmail?: boolean;
    showLocation?: boolean;
    allowMessages?: boolean;
  }) => {
    return api.put("/users/me/privacy", settings);
  },

  // Get privacy settings
  getPrivacySettings: () => {
    return api.get("/users/me/privacy");
  },

  // Delete account
  deleteAccount: () => {
    return api.delete("/users/me");
  },

  // ==================== PUBLIC PROFILES ====================

  // Get user by username
  getUserByUsername: (username: string) => {
    return api.get(`/users/${username}`);
  },

  // Search users
  searchUsers: (
    query: string,
    params?: {
      role?: string;
      limit?: number;
    }
  ) => {
    return api.get("/users/search", { params: { q: query, ...params } });
  },

  // ==================== FOLLOW SYSTEM ====================

  // Follow user
  followUser: (userId: string) => {
    return api.post(`/users/${userId}/follow`);
  },

  // Unfollow user
  unfollowUser: (userId: string) => {
    return api.delete(`/users/${userId}/follow`);
  },

  // Get followers
  getFollowers: (
    username: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return api.get(`/users/${username}/followers`, { params });
  },

  // Get following
  getFollowing: (
    username: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ) => {
    return api.get(`/users/${username}/following`, { params });
  },

  // Check if following
  checkFollowing: (userId: string) => {
    return api.get(`/users/${userId}/is-following`);
  },

  // ==================== NOTIFICATIONS ====================

  // Get notifications
  getNotifications: (params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }) => {
    return api.get("/users/me/notifications", { params });
  },

  // Mark notification as read
  markNotificationRead: (notificationId: string) => {
    return api.patch(`/users/me/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: () => {
    return api.patch("/users/me/notifications/read-all");
  },

  // Get unread notification count
  getUnreadCount: () => {
    return api.get("/users/me/notifications/unread-count");
  },
};
