/**
 * @file src/utils/validators.ts
 * @description Form validation helper functions
 */

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requirements: 8+ chars, uppercase, lowercase, number
 */
export const isValidPassword = (password: string): boolean => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return minLength && hasUppercase && hasLowercase && hasNumber;
};

/**
 * Get password strength score (0-4)
 */
export const getPasswordStrength = (
  password: string
): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: "Very Weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-500" },
    { label: "Fair", color: "bg-yellow-500" },
    { label: "Good", color: "bg-blue-500" },
    { label: "Strong", color: "bg-green-500" },
  ];

  const level = Math.min(score, 4);
  return { score: level, ...levels[level] };
};

/**
 * Validate username format
 * Requirements: 3-30 chars, lowercase letters, numbers, underscores, hyphens
 */
export const isValidUsername = (username: string): boolean => {
  const usernameRegex = /^[a-z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate GitHub username
 */
export const isValidGitHubUsername = (username: string): boolean => {
  // GitHub usernames: 1-39 chars, alphanumeric with single hyphens
  const githubRegex = /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;
  return githubRegex.test(username);
};

/**
 * Validate LinkedIn URL
 */
export const isValidLinkedInUrl = (url: string): boolean => {
  const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
  return linkedinRegex.test(url);
};

/**
 * Check if string is empty or whitespace only
 */
export const isEmpty = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * Check if value is within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate phone number (basic international format)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s-()]{10,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Sanitize input string (remove dangerous characters)
 */
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, "").trim();
};

/**
 * Validate form fields and return errors
 */
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): ValidationResult => {
  const errors: Record<string, string> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];

    for (const rule of fieldRules) {
      if (rule.required && isEmpty(value)) {
        errors[field] = rule.message;
        break;
      }

      if (value && rule.minLength && value.length < rule.minLength) {
        errors[field] = rule.message;
        break;
      }

      if (value && rule.maxLength && value.length > rule.maxLength) {
        errors[field] = rule.message;
        break;
      }

      if (value && rule.pattern && !rule.pattern.test(value)) {
        errors[field] = rule.message;
        break;
      }

      if (value && rule.custom && !rule.custom(value)) {
        errors[field] = rule.message;
        break;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
