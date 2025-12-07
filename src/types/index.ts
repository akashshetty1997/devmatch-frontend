/**
 * @file src/types/index.ts
 * @description TypeScript interfaces and types
 */

// ==================== USER TYPES ====================

export interface User {
  _id: string;
  username: string;
  email: string;
  role: "DEVELOPER" | "RECRUITER" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthUser extends User {
  token: string;
}

// ==================== PROFILE TYPES ====================

export interface DeveloperProfile {
  _id: string;
  user: User | string;
  headline: string;
  bio: string;
  skills: string[];
  yearsOfExperience: number;
  location: Location;
  isOpenToWork: boolean;
  preferredWorkTypes: WorkType[];
  githubUsername: string | null;
  pinnedRepos: RepoSnapshot[];
  portfolioUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  profileCompleteness: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecruiterProfile {
  _id: string;
  user: User | string;
  companyName: string;
  companyWebsite: string | null;
  companyLogo: string | null;
  companyDescription: string;
  companySize: CompanySize | null;
  industry: string | null;
  positionTitle: string;
  hiringRegions: string[];
  linkedinUrl: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  city?: string;
  state?: string;
  country?: string;
}

export type WorkType = "REMOTE" | "ONSITE" | "HYBRID";

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+";

// ==================== JOB TYPES ====================

export interface JobPost {
  _id: string;
  recruiter: User | string;
  title: string;
  companyName: string;
  description: string;
  location: Location;
  workType: WorkType;
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsExperience: number;
  maxYearsExperience: number | null;
  salary: SalaryRange;
  employmentType: EmploymentType;
  applicationDeadline: string | null;
  externalApplicationUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  applicationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRange {
  min?: number;
  max?: number;
  currency: string;
  isVisible: boolean;
}

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP"
  | "FREELANCE";

// ==================== APPLICATION TYPES ====================

export interface Application {
  _id: string;
  applicant: User;
  jobPost: JobPost;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  appliedAt: string;
  updatedAt: string;
  developerProfile?: DeveloperProfile;
}

export type ApplicationStatus =
  | "PENDING"
  | "REVIEWED"
  | "SHORTLISTED"
  | "REJECTED";

// ==================== POST TYPES ====================

export interface Post {
  _id: string;
  author: User;
  content: string;
  type: PostType;
  repo?: RepoSnapshot;
  jobPost?: JobPost;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PostType = "TEXT" | "SHARE_REPO" | "SHARE_JOB";

export interface Comment {
  _id: string;
  author: User;
  post: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  _id: string;
  user: string;
  post: string;
  createdAt: string;
}

// ==================== REPO TYPES ====================

export interface RepoSnapshot {
  _id: string;
  githubId: number;
  ownerLogin: string;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string | null;
  language: string | null;
  languages: LanguageBreakdown[];
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  isPrivate: boolean;
  isFork: boolean;
  defaultBranch: string;
  topics: string[];
  license: string | null;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  githubPushedAt: string;
  readme: string | null;
  aiSummary: string | null;
  aiTechStack: string[];
  aiComplexityLevel: ComplexityLevel | null;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageBreakdown {
  name: string;
  bytes: number;
  percentage: number;
}

export type ComplexityLevel =
  | "BEGINNER"
  | "INTERMEDIATE"
  | "ADVANCED"
  | "EXPERT";

// ==================== SKILL TYPES ====================

export interface Skill {
  _id: string;
  name: string;
  slug: string;
  category: SkillCategory;
  icon: string | null;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SkillCategory =
  | "LANGUAGE"
  | "FRONTEND"
  | "BACKEND"
  | "DATABASE"
  | "DEVOPS"
  | "MOBILE"
  | "TOOLS"
  | "SOFT_SKILL"
  | "OTHER";

export interface GroupedSkills {
  [category: string]: Skill[];
}

// ==================== FOLLOW TYPES ====================

export interface Follow {
  _id: string;
  follower: User | string;
  following: User | string;
  createdAt: string;
}

// ==================== NOTIFICATION TYPES ====================

export interface Notification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | "FOLLOW"
  | "LIKE"
  | "COMMENT"
  | "APPLICATION"
  | "APPLICATION_STATUS"
  | "JOB_MATCH"
  | "SYSTEM";

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ==================== FORM TYPES ====================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "DEVELOPER" | "RECRUITER";
}

export interface JobFormData {
  title: string;
  description: string;
  location: Location;
  workType: WorkType;
  requiredSkills: string[];
  preferredSkills: string[];
  minYearsExperience: number;
  maxYearsExperience?: number;
  salary: SalaryRange;
  employmentType: EmploymentType;
  applicationDeadline?: string;
  externalApplicationUrl?: string;
}

export interface DeveloperProfileFormData {
  headline: string;
  bio: string;
  skills: string[];
  yearsOfExperience: number;
  location: Location;
  isOpenToWork: boolean;
  preferredWorkTypes: WorkType[];
  githubUsername?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  isPublic: boolean;
}

export interface RecruiterProfileFormData {
  companyName: string;
  companyWebsite?: string;
  companyDescription: string;
  companySize?: CompanySize;
  industry?: string;
  positionTitle: string;
  hiringRegions: string[];
  linkedinUrl?: string;
  isPublic: boolean;
}

// ==================== FILTER/SEARCH TYPES ====================

export interface JobFilters {
  q?: string;
  skills?: string[];
  workType?: WorkType;
  employmentType?: EmploymentType;
  country?: string;
  minSalary?: number;
  maxExperience?: number;
  featured?: boolean;
}

export interface DeveloperFilters {
  q?: string;
  skills?: string[];
  minExp?: number;
  maxExp?: number;
  country?: string;
  openToWork?: boolean;
}

// ==================== ADMIN TYPES ====================

export interface DashboardStats {
  users: {
    total: number;
    developers: number;
    recruiters: number;
    admins: number;
    newThisWeek: number;
    banned: number;
  };
  jobs: {
    total: number;
    active: number;
    inactive: number;
    newThisWeek: number;
  };
  applications: {
    total: number;
    pending: number;
    thisWeek: number;
  };
  skills: {
    total: number;
    active: number;
    inactive: number;
  };
}

export interface Activity {
  type: string;
  message: string;
  createdAt: string;
  data?: Record<string, any>;
}

export interface Report {
  _id: string;
  reporter: User;
  targetType: "POST" | "COMMENT" | "USER" | "JOB";
  targetId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED";
  resolution?: string;
  resolvedBy?: User;
  resolvedAt?: string;
  createdAt: string;
}
