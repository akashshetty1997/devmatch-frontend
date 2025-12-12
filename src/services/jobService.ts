/**
 * @file src/services/jobService.ts
 * @description Job API service
 */

import api from "./api";

export const jobService = {
  // Get all jobs with filters
  getJobs: (params?: {
    page?: number;
    limit?: number;
    q?: string;
    skills?: string;
    workType?: string;
    country?: string;
    employmentType?: string;
    featured?: boolean;
  }) => {
    return api.get("/jobs", { params });
  },

  // Get single job by ID
  getJob: (id: string) => {
    return api.get(`/jobs/${id}`);
  },

  // Get featured jobs
  getFeaturedJobs: (limit: number = 6) => {
    return api.get("/jobs/featured", { params: { limit } });
  },

  // Create job (Recruiter only)
  createJob: (data: {
    title: string;
    companyName: string;
    description: string;
    location?: { city?: string; state?: string; country?: string };
    workType: string;
    requiredSkills?: string[];
    preferredSkills?: string[];
    minYearsExperience?: number;
    maxYearsExperience?: number;
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
      isVisible?: boolean;
    };
    employmentType?: string;
    applicationDeadline?: string;
    externalApplicationUrl?: string;
  }) => {
    return api.post("/jobs", data);
  },

  // Update job
  updateJob: (id: string, data: any) => {
    return api.put(`/jobs/${id}`, data);
  },

  // Delete job
  deleteJob: (id: string) => {
    return api.delete(`/jobs/${id}`);
  },

  // Get my jobs (Recruiter) - Fixed endpoint
  getMyJobs: (params?: { page?: number; limit?: number }) => {
    return api.get("/jobs/me", { params });
  },

  // Activate job - Fixed endpoint to match backend
  activateJob: (id: string) => {
    return api.patch(`/jobs/${id}/status`, { isActive: true });
  },

  // Deactivate job - Fixed endpoint to match backend
  deactivateJob: (id: string) => {
    return api.patch(`/jobs/${id}/status`, { isActive: false });
  },

  // Toggle featured (Admin)
  toggleFeatured: (id: string) => {
    return api.patch(`/jobs/${id}/featured`);
  },

  // Search jobs
  searchJobs: (query: string, params?: { limit?: number }) => {
    return api.get("/jobs/search", { params: { q: query, ...params } });
  },
};
