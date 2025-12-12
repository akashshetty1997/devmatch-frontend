/**
 * @file src/services/adminService.ts
 * @description API service for admin functionality
 */

import api from "./api";

export const adminService = {
  // ==================== DASHBOARD ====================

  getDashboardStats: () => {
    return api.get("/admin/dashboard/stats");
  },

  getRecentUsers: (limit: number = 5) => {
    return api.get("/admin/dashboard/recent-users", { params: { limit } });
  },

  getRecentActivity: (limit: number = 10) => {
    return api.get("/admin/dashboard/activity", { params: { limit } });
  },

  // ==================== USER MANAGEMENT ====================

  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    return api.get("/admin/users", { params });
  },

  getUser: (userId: string) => {
    return api.get(`/admin/users/${userId}`);
  },

  updateUserRole: (userId: string, role: string) => {
    return api.patch(`/admin/users/${userId}/role`, { role });
  },

  banUser: (userId: string, reason?: string) => {
    return api.patch(`/admin/users/${userId}/ban`, { reason });
  },

  unbanUser: (userId: string) => {
    return api.patch(`/admin/users/${userId}/unban`);
  },

  deleteUser: (userId: string) => {
    return api.delete(`/admin/users/${userId}`);
  },

  // ==================== SKILL MANAGEMENT ====================

  getSkills: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isActive?: boolean;
  }) => {
    return api.get("/admin/skills", { params });
  },

  createSkill: (data: { name: string; category: string; icon?: string }) => {
    return api.post("/admin/skills", data);
  },

  updateSkill: (
    skillId: string,
    data: {
      name?: string;
      category?: string;
      icon?: string;
      isActive?: boolean;
    }
  ) => {
    return api.put(`/admin/skills/${skillId}`, data);
  },

  deactivateSkill: (skillId: string) => {
    return api.patch(`/admin/skills/${skillId}/deactivate`);
  },

  activateSkill: (skillId: string) => {
    return api.patch(`/admin/skills/${skillId}/activate`);
  },

  deleteSkill: (skillId: string) => {
    return api.delete(`/admin/skills/${skillId}`);
  },

  // ==================== JOB MANAGEMENT ====================

  getJobs: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    featured?: boolean;
  }) => {
    return api.get("/admin/jobs", { params });
  },

  toggleJobFeatured: (jobId: string, featured: boolean) => {
    return api.patch(`/admin/jobs/${jobId}/featured`, { featured });
  },

  deactivateJob: (jobId: string) => {
    return api.patch(`/admin/jobs/${jobId}/deactivate`);
  },

  deleteJob: (jobId: string) => {
    return api.delete(`/admin/jobs/${jobId}`);
  },

  // ==================== REPORTS ====================

  getReports: (params?: {
    page?: number;
    limit?: number;
    type?: "POST" | "COMMENT" | "USER" | "JOB";
    status?: "PENDING" | "REVIEWED" | "RESOLVED";
  }) => {
    return api.get("/admin/reports", { params });
  },

  resolveReport: (
    reportId: string,
    action: "DISMISS" | "WARN" | "REMOVE" | "BAN"
  ) => {
    return api.patch(`/admin/reports/${reportId}/resolve`, { action });
  },

  // ==================== ANALYTICS ====================

  getAnalytics: (params?: {
    startDate?: string;
    endDate?: string;
    metric?: string;
  }) => {
    return api.get("/admin/analytics", { params });
  },
};
