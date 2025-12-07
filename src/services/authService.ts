/**
 * @file src/services/authService.ts
 * @description Authentication API service
 */

import api from "./api";

export const authService = {
  login: (email: string, password: string) => {
    return api.post("/auth/login", { email, password });
  },

  register: (data: {
    username: string;
    email: string;
    password: string;
    role: string;
  }) => {
    return api.post("/auth/register", data);
  },

  getMe: () => {
    return api.get("/auth/me");
  },

  logout: () => {
    return api.post("/auth/logout");
  },
};
