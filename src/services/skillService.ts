/**
 * @file src/services/skillService.ts
 * @description API service for skills
 */

import api from "./api";

export const skillService = {
  // Get all active skills
  getSkills: (params?: { grouped?: boolean }) => {
    return api.get("/skills", { params });
  },

  // Get skills grouped by category
  getSkillsGrouped: () => {
    return api.get("/skills", { params: { grouped: "true" } });
  },

  // Search skills (for autocomplete)
  searchSkills: (query: string, limit?: number) => {
    return api.get("/skills/search", {
      params: { q: query, limit: limit || 10 },
    });
  },
};
