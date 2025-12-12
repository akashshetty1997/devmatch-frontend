/**
 * @file src/services/applicationService.ts
 * @description API service for job applications
 */

import api from "./api";

export const applicationService = {
  // ==================== DEVELOPER (APPLICANT) ====================

  // Apply to a job
  applyToJob: (
    jobId: string,
    data: {
      coverLetter?: string;
      resumeUrl?: string;
    }
  ) => {
    return api.post(`/jobs/${jobId}/apply`, data);
  },

  // Get my applications (as developer)
  getMyApplications: (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return api.get("/applications/me", { params }); // Changed from /my to /me
  },

  // Get single application
  getApplication: (applicationId: string) => {
    return api.get(`/applications/${applicationId}`);
  },

  // Withdraw application
  withdrawApplication: (applicationId: string) => {
    return api.delete(`/applications/${applicationId}`);
  },

  // Check if already applied to a job
  checkApplicationStatus: (jobId: string) => {
    return api.get(`/jobs/${jobId}/application-status`);
  },

  // ==================== RECRUITER ====================

  // Get applications for recruiter's jobs
  getRecruiterApplications: (params?: {
    page?: number;
    limit?: number;
    jobId?: string;
    status?: string;
    sort?: string;
  }) => {
    return api.get("/applications/recruiter", { params });
  },

  // Get applications for a specific job
  getJobApplications: (
    jobId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) => {
    return api.get(`/jobs/${jobId}/applications`, { params });
  },

  // Update application status
  updateStatus: (applicationId: string, status: string) => {
    return api.patch(`/applications/${applicationId}/status`, { status });
  },

  // Bulk update application status
  bulkUpdateStatus: (applicationIds: string[], status: string) => {
    return api.patch("/applications/bulk-status", { applicationIds, status });
  },

  // Add note to application
  addNote: (applicationId: string, note: string) => {
    return api.post(`/applications/${applicationId}/notes`, { note });
  },

  // Get application statistics for recruiter
  getApplicationStats: () => {
    return api.get("/applications/stats");
  },

  withdraw: (applicationId: string) => {
  return api.patch(`/applications/${applicationId}/withdraw`);
},
};
