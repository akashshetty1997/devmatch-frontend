/**
 * @file src/lib/api.ts
 * @description Axios API client with interceptors
 */

import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and Cookies for token
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem("token") || Cookies.get("token")
      : Cookies.get("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Create an event emitter for global errors
export const apiErrorEvent = new EventTarget();

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Emit event for rate limit errors (429)
    if (status === 429) {
      apiErrorEvent.dispatchEvent(
        new CustomEvent("apiError", { detail: { type: "rateLimit", error } })
      );
    }

    // Handle 401 - redirect to login
    if (status === 401) {
      Cookies.remove("token");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  register: (data: {
    username: string;
    email: string;
    password: string;
    role: "DEVELOPER" | "RECRUITER";
    companyName?: string;
  }) => api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getMe: () => api.get("/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put("/auth/password", data),

  updateAvatar: (avatarUrl: string) => api.put("/auth/avatar", { avatarUrl }),
};

// ==================== USER API ====================
export const userAPIOriginal = {
  getByUsername: (username: string) => api.get(`/users/${username}`),

  search: (params: {
    q?: string;
    role?: string;
    skills?: string;
    page?: number;
    limit?: number;
  }) => api.get("/users", { params }),

  getRecentUsers: (limit = 10) =>
    api.get("/users/recent", { params: { limit } }),

  getFeaturedDevelopers: (limit = 6) =>
    api.get("/users/featured/developers", { params: { limit } }),

  getUserPosts: (username: string, page = 1, limit = 20) =>
    api.get(`/users/${username}/posts`, { params: { page, limit } }),
};

// Updated USER API
export const userAPINew = {
  // Get user profile by username
  getProfile: (username: string) => api.get(`/users/${username}`),

  // Update own profile
  updateProfile: (data: any) => api.put("/users/profile", data),

  // Follow a user
  follow: (userId: string) => api.post(`/users/${userId}/follow`),

  // Unfollow a user
  unfollow: (userId: string) => api.delete(`/users/${userId}/follow`),

  // Get followers
  getFollowers: (username: string, page = 1) =>
    api.get(`/users/${username}/followers`, { params: { page } }),

  // Get following
  getFollowing: (username: string, page = 1) =>
    api.get(`/users/${username}/following`, { params: { page } }),

  // Upload avatar
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ==================== PROFILE API ====================
export const profileAPI = {
  getDeveloperProfile: () => api.get("/profile/developer"),

  updateDeveloperProfile: (data: {
    headline?: string;
    bio?: string;
    skills?: string[];
    yearsOfExperience?: number;
    location?: { city?: string; state?: string; country?: string };
    isOpenToWork?: boolean;
    preferredWorkTypes?: string[];
    githubUsername?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
  }) => api.put("/profile/developer", data),

  getRecruiterProfile: () => api.get("/profile/recruiter"),

  updateRecruiterProfile: (data: {
    companyName?: string;
    companyWebsite?: string;
    companyDescription?: string;
    companySize?: string;
    industry?: string;
    positionTitle?: string;
    location?: { city?: string; state?: string; country?: string };
    portfolioUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
  }) => api.put("/profile/recruiter", data),

  addSkill: (skillSlug: string) => api.post("/profile/skills", { skillSlug }),

  removeSkill: (skillSlug: string) =>
    api.delete(`/profile/skills/${skillSlug}`),

  pinRepo: (repoId: string) => api.post("/profile/repos/pin", { repoId }),

  unpinRepo: (repoId: string) => api.delete(`/profile/repos/pin/${repoId}`),
};

// ==================== REPO API ====================
export const repoAPI = {
  search: (params: {
    q: string;
    language?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }) => api.get("/repos/search", { params }),

  getDetails: (owner: string, repo: string) =>
    api.get(`/repos/details/${owner}/${repo}`),

  getById: (repoId: string) => api.get(`/repos/${repoId}`),

  getUserRepos: (username: string, page = 1, limit = 10) =>
    api.get(`/repos/user/${username}`, { params: { page, limit } }),

  getTrending: (language?: string, since = "weekly") =>
    api.get("/repos/trending", { params: { language, since } }),

  getReadme: (repoId: string) => api.get(`/repos/${repoId}/readme`),
};

// ==================== JOB API ====================
export const jobAPIOriginal = {
  getAll: (params: {
    q?: string;
    skills?: string;
    workType?: string;
    country?: string;
    page?: number;
    limit?: number;
  }) => api.get("/jobs", { params }),

  getById: (jobId: string) => api.get(`/jobs/${jobId}`),

  getFeatured: (limit = 5) => api.get("/jobs/featured", { params: { limit } }),

  getRecent: (limit = 10) => api.get("/jobs/recent", { params: { limit } }),

  create: (data: {
    title: string;
    description: string;
    companyName: string;
    workType: "REMOTE" | "ONSITE" | "HYBRID";
    location?: { city?: string; state?: string; country?: string };
    requiredSkills?: string[];
    preferredSkills?: string[];
    minYearsExperience?: number;
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
      isVisible?: boolean;
    };
    employmentType?: string;
    applicationDeadline?: string;
  }) => api.post("/jobs", data),

  update: (jobId: string, data: object) => api.put(`/jobs/${jobId}`, data),

  toggleStatus: (jobId: string) => api.patch(`/jobs/${jobId}/status`),

  delete: (jobId: string) => api.delete(`/jobs/${jobId}`),

  getMyJobs: (params: { isActive?: boolean; page?: number; limit?: number }) =>
    api.get("/jobs/me", { params }),
};

// Updated JOB API
export const jobAPINew = {
  // Get all jobs
  getAll: (params?: {
    q?: string;
    skills?: string[];
    workType?: string;
    page?: number;
    limit?: number;
  }) => api.get("/jobs", { params }),

  // Get featured jobs
  getFeatured: (limit = 6) => api.get("/jobs/featured", { params: { limit } }),

  // Get job by ID
  getById: (id: string) => api.get(`/jobs/${id}`),

  // Get jobs by recruiter
  getByRecruiter: (recruiterId: string) =>
    api.get(`/jobs/recruiter/${recruiterId}`),

  // Create job (recruiter only)
  create: (data: any) => api.post("/jobs", data),

  // Update job
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),

  // Delete job
  delete: (id: string) => api.delete(`/jobs/${id}`),

  // Apply for job
  apply: (jobId: string, data?: { coverLetter?: string }) =>
    api.post(`/jobs/${jobId}/apply`, data),

  // Get applications for a job (recruiter only)
  getApplications: (jobId: string) => api.get(`/jobs/${jobId}/applications`),
};

// ==================== APPLICATION API ====================
export const applicationAPI = {
  apply: (jobId: string, data: { coverLetter?: string; resumeUrl?: string }) =>
    api.post(`/jobs/${jobId}/applications`, data),

  getJobApplications: (
    jobId: string,
    params: { status?: string; page?: number }
  ) => api.get(`/jobs/${jobId}/applications`, { params }),

  getMyApplications: (params: { status?: string; page?: number }) =>
    api.get("/applications/me", { params }),

  getById: (applicationId: string) => api.get(`/applications/${applicationId}`),

  updateStatus: (applicationId: string, status: string, note?: string) =>
    api.patch(`/applications/${applicationId}/status`, { status, note }),

  withdraw: (applicationId: string) =>
    api.delete(`/applications/${applicationId}`),
};

// ==================== POST API ====================
export const postAPIOriginal = {
  getFeed: (params: { type?: string; page?: number; limit?: number }) =>
    api.get("/posts", { params }),

  getById: (postId: string) => api.get(`/posts/${postId}`),

  create: (data: {
    content: string;
    type?: "TEXT" | "SHARE_REPO" | "SHARE_JOB";
    repoId?: string;
    jobPostId?: string;
  }) => api.post("/posts", data),

  update: (postId: string, content: string) =>
    api.put(`/posts/${postId}`, { content }),

  delete: (postId: string) => api.delete(`/posts/${postId}`),

  getTrending: (limit = 10) =>
    api.get("/posts/trending", { params: { limit } }),
};

// Updated POST API
export const postAPINew = {
  // Get feed
  getFeed: (page = 1) => api.get("/posts/feed", { params: { page } }),

  // Get posts by user ID
  getByUser: (userId: string, page = 1, limit = 10) =>
    api.get(`/posts/user/${userId}`, { params: { page, limit } }),

  // Get posts by username
  getByUsername: (username: string, page = 1) =>
    api.get(`/users/${username}/posts`, { params: { page } }),

  // Create post
  create: (data: {
    content: string;
    type?: string;
    repoId?: string;
    jobId?: string;
  }) => api.post("/posts", data),

  // Like post - Updated endpoint
  like: (postId: string) => api.post(`/posts/${postId}/likes`),

  // Unlike post - Updated endpoint
  unlike: (postId: string) => api.delete(`/posts/${postId}/likes`),

  // Delete post
  delete: (postId: string) => api.delete(`/posts/${postId}`),
};

// ==================== LIKE API ====================
export const likeAPI = {
  like: (postId: string) => api.post(`/posts/${postId}/likes`),

  unlike: (postId: string) => api.delete(`/posts/${postId}/likes`),

  toggle: (postId: string) => api.post(`/posts/${postId}/likes/toggle`),

  getLikers: (postId: string, page = 1) =>
    api.get(`/posts/${postId}/likes`, { params: { page } }),
};

// ==================== COMMENT API ====================
export const commentAPIOriginal = {
  getByPost: (postId: string, page = 1, limit = 20) =>
    api.get(`/posts/${postId}/comments`, { params: { page, limit } }),

  create: (postId: string, content: string) =>
    api.post(`/posts/${postId}/comments`, { content }),

  update: (commentId: string, content: string) =>
    api.put(`/comments/${commentId}`, { content }),

  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// Updated COMMENT API
export const commentAPINew = {
  // Get comments for a post
  getByPost: (postId: string, page = 1) =>
    api.get(`/comments/post/${postId}`, { params: { page } }),

  // Get comments for a repo
  getByRepo: (repoId: string, page = 1) =>
    api.get(`/comments/repo/${repoId}`, { params: { page } }),

  // Create comment on post
  createOnPost: (postId: string, data: { content: string }) =>
    api.post(`/comments/post/${postId}`, data),

  // Create comment on repo
  createOnRepo: (repoId: string, data: { content: string }) =>
    api.post(`/comments/repo/${repoId}`, data),

  // Delete comment
  delete: (commentId: string) => api.delete(`/comments/${commentId}`),
};

// ==================== FOLLOW API ====================
export const followAPI = {
  follow: (username: string) => api.post(`/users/${username}/follow`),

  unfollow: (username: string) => api.delete(`/users/${username}/follow`),

  getFollowers: (username: string, page = 1) =>
    api.get(`/users/${username}/followers`, { params: { page } }),

  getFollowing: (username: string, page = 1) =>
    api.get(`/users/${username}/following`, { params: { page } }),

  checkStatus: (username: string) =>
    api.get(`/users/${username}/follow/status`),
};

// ==================== REVIEW API ====================
export const reviewAPIOriginal = {
  reviewDeveloper: (
    developerId: string,
    data: { rating: number; content?: string; title?: string }
  ) => api.post(`/reviews/developer/${developerId}`, data),

  reviewRepo: (
    repoId: string,
    data: { rating: number; content?: string; title?: string }
  ) => api.post(`/reviews/repo/${repoId}`, data),

  getDeveloperReviews: (developerId: string, page = 1) =>
    api.get(`/reviews/developer/${developerId}`, { params: { page } }),

  getRepoReviews: (repoId: string, page = 1) =>
    api.get(`/reviews/repo/${repoId}`, { params: { page } }),

  update: (
    reviewId: string,
    data: { rating?: number; content?: string; title?: string }
  ) => api.put(`/reviews/${reviewId}`, data),

  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),

  getMyReviews: (page = 1) => api.get("/reviews/me", { params: { page } }),
};

// Updated REVIEW API
export const reviewAPINew = {
  // Get reviews by username
  getByUsername: (username: string, page = 1) =>
    api.get(`/reviews/user/${username}`, { params: { page } }),

  // Get reviews for a repo
  getByRepo: (repoId: string, page = 1) =>
    api.get(`/reviews/repo/${repoId}`, { params: { page } }),

  // Create review for repo
  createForRepo: (
    repoId: string,
    data: { rating: number; title?: string; content?: string }
  ) => api.post(`/reviews/repo/${repoId}`, data),

  // Update review
  update: (
    reviewId: string,
    data: { rating?: number; title?: string; content?: string }
  ) => api.put(`/reviews/${reviewId}`, data),

  // Delete review
  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
};

// ==================== ACTIVITY API ====================
export const activityAPI = {
  getFeed: (params: { type?: string; unreadOnly?: boolean; page?: number }) =>
    api.get("/activity", { params }),

  getUnreadCount: () => api.get("/activity/unread/count"),

  markAsRead: (activityIds?: string[]) =>
    api.post("/activity/read", { activityIds }),

  markOneAsRead: (activityId: string) =>
    api.patch(`/activity/${activityId}/read`),

  delete: (activityId: string) => api.delete(`/activity/${activityId}`),

  clearAll: () => api.delete("/activity/all"),
};

// ==================== GITHUB API ====================
export const githubAPI = {
  // Search GitHub repos (via our backend which calls GitHub API)
  searchRepos: (params: {
    q: string;
    language?: string;
    sort?: string;
    order?: string;
    page?: number;
    per_page?: number;
  }) => api.get("/github/search/repos", { params }),

  // Get repo by ID (from our cache/database) - Updated endpoint
  getRepo: (id: string) => api.get(`/repos/${id}`),

  // Get repo by full name (owner/repo) - Updated endpoint
  getRepoByFullName: (fullName: string) => api.get(`/github/repos/${fullName}`),

  // Get trending repos
  getTrending: (params?: {
    language?: string;
    since?: string;
    limit?: number;
  }) => api.get("/github/trending", { params }),

  // Get repo README
  getReadme: (fullName: string) => api.get(`/github/repos/${fullName}/readme`),

  // Get repo languages
  getLanguages: (fullName: string) =>
    api.get(`/github/repos/${fullName}/languages`),

  // Sync repo data from GitHub (refresh cache)
  syncRepo: (fullName: string) => api.post(`/github/repos/${fullName}/sync`),
};

// ==================== DEVELOPER API ====================
export const developerAPI = {
  // Get developer profile
  getProfile: (userId: string) => api.get(`/developers/${userId}`),

  // Get developer's pinned repos by username (public)
  getPinnedRepos: (username: string) =>
    api.get(`/developers/${username}/pinned-repos`),

  // Get developer's all repos
  getRepos: (username: string, page = 1) =>
    api.get(`/developers/${username}/repos`, { params: { page } }),

  // Pin a repo (for own profile)
  pinRepo: (repoId: string) => api.post(`/developers/me/pinned-repos`, { repoId }),

  // Unpin a repo (for own profile)
  unpinRepo: (repoId: string) => api.delete(`/developers/me/pinned-repos/${repoId}`),

  // Search developers
  search: (params: {
    q?: string;
    skills?: string[];
    isOpenToWork?: boolean;
    page?: number;
  }) => api.get("/developers/search", { params }),
};

// ==================== SKILL API ====================
export const skillAPI = {
  getAll: (grouped = false) =>
    api.get("/skills", { params: { grouped: grouped.toString() } }),

  search: (q: string, limit = 10) =>
    api.get("/skills/search", { params: { q, limit } }),
};
