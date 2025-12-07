/**
 * @file src/services/developerService.ts
 * @description API service for developer profiles and listings
 */

import api from "./api";

export const developerService = {
  // ==================== PUBLIC ====================

  // Get all developers (public listing)
  getDevelopers: (params?: {
    page?: number;
    limit?: number;
    q?: string;
    skills?: string;
    minExp?: string;
    maxExp?: string;
    country?: string;
    openToWork?: boolean;
    sort?: string;
  }) => {
    return api.get("/developers", { params });
  },

  // Get developer profile by username
  getDeveloperByUsername: (username: string) => {
    return api.get(`/developers/${username}`);
  },

  // Search developers
  searchDevelopers: (
    query: string,
    params?: {
      limit?: number;
      skills?: string[];
    }
  ) => {
    return api.get("/developers/search", {
      params: { q: query, ...params },
    });
  },

  // Get featured developers
  getFeaturedDevelopers: (limit: number = 6) => {
    return api.get("/developers/featured", { params: { limit } });
  },

  // ==================== PROFILE MANAGEMENT ====================

  // Get my developer profile
  getMyProfile: () => {
    return api.get("/developers/me");
  },

  // Update my developer profile
  updateMyProfile: (data: {
    headline?: string;
    bio?: string;
    skills?: string[];
    yearsOfExperience?: number;
    location?: {
      city?: string;
      state?: string;
      country?: string;
    };
    isOpenToWork?: boolean;
    preferredWorkTypes?: string[];
    githubUsername?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
    isPublic?: boolean;
  }) => {
    return api.put("/developers/me", data);
  },

  // ==================== SKILLS ====================

  // Add skill to profile
  addSkill: (skillSlug: string) => {
    return api.post("/developers/me/skills", { skill: skillSlug });
  },

  // Remove skill from profile
  removeSkill: (skillSlug: string) => {
    return api.delete(`/developers/me/skills/${skillSlug}`);
  },

  // Update all skills
  updateSkills: (skills: string[]) => {
    return api.put("/developers/me/skills", { skills });
  },

  // ==================== PINNED REPOS ====================

  // Get pinned repos
  getPinnedRepos: () => {
    return api.get("/developers/me/pinned-repos");
  },

  // Pin a repo
  pinRepo: (repoId: string) => {
    return api.post("/developers/me/pinned-repos", { repoId });
  },

  // Unpin a repo
  unpinRepo: (repoId: string) => {
    return api.delete(`/developers/me/pinned-repos/${repoId}`);
  },

  // Reorder pinned repos
  reorderPinnedRepos: (repoIds: string[]) => {
    return api.put("/developers/me/pinned-repos/reorder", { repoIds });
  },

  // ==================== WORK PREFERENCES ====================

  // Update work preferences
  updateWorkPreferences: (data: {
    isOpenToWork: boolean;
    preferredWorkTypes: string[];
    expectedSalary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    preferredLocations?: string[];
  }) => {
    return api.put("/developers/me/work-preferences", data);
  },

  // ==================== STATS ====================

  // Get profile views
  getProfileViews: (params?: { startDate?: string; endDate?: string }) => {
    return api.get("/developers/me/views", { params });
  },

  // Get profile completeness
  getProfileCompleteness: () => {
    return api.get("/developers/me/completeness");
  },
};
