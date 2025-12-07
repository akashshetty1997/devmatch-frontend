/**
 * @file src/store/uiStore.ts
 * @description UI state management
 */

import { create } from "zustand";

interface UIState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  isLoading: boolean;
  searchQuery: string;

  // Actions
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  isLoading: false,
  searchQuery: "",

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setLoading: (isLoading) => set({ isLoading }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
