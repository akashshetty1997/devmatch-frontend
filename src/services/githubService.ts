/**
 * @file src/services/githubService.ts
 * @description GitHub API service
 */

import api from "./api";

export const githubService = {
  // Search GitHub repos (via backend)
  searchRepos: (params: {
    q: string;
    language?: string;
    sort?: string;
    order?: string;
    page?: number;
    per_page?: number;
  }) => {
    return api.get("/github/search/repos", { params });
  },

  // Get repo by MongoDB ID
  getRepo: (id: string) => {
    return api.get(`/repos/${id}`);
  },

  // Get repo by full name (owner/repo) - fetches from GitHub and caches
  getRepoByFullName: (fullName: string) => {
    return api.get(`/github/repos/${fullName}`);
  },

  // Get trending repos
  getTrending: (params?: {
    language?: string;
    since?: string;
    limit?: number;
  }) => {
    return api.get("/github/trending", { params });
  },

  // Get repo README
  getReadme: (fullName: string) => {
    return api.get(`/github/repos/${fullName}/readme`);
  },

  // Get repo languages
  getLanguages: (fullName: string) => {
    return api.get(`/github/repos/${fullName}/languages`);
  },

  // Get user repos
  getUserRepos: (
    username: string,
    params?: { page?: number; per_page?: number }
  ) => {
    return api.get(`/github/users/${username}/repos`, { params });
  },

  // Sync repo (refresh cache)
  syncRepo: (fullName: string) => {
    return api.post(`/github/repos/${fullName}/sync`);
  },
};
