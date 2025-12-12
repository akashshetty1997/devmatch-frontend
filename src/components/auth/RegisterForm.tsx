/**
 * @file src/components/auth/RegisterForm.tsx
 * @description Register form component with role selection and password validation
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiCode,
  FiBriefcase,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { FaBuilding } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Button, Input } from "@/components/common";
import { isValidEmail, cn } from "@/lib/utils";

type Role = "DEVELOPER" | "RECRUITER";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    label: "One number",
    test: (password) => /[0-9]/.test(password),
  },
];

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuthStore();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "DEVELOPER" as Role,
    companyName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Check password requirements
  const passwordChecks = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(formData.password),
    }));
  }, [formData.password]);

  const allPasswordRequirementsMet = passwordChecks.every((req) => req.passed);

  // Set role from URL param
  useEffect(() => {
    const roleParam = searchParams?.get("role");
    if (roleParam === "developer" || roleParam === "recruiter") {
      setFormData((prev) => ({
        ...prev,
        role: roleParam.toUpperCase() as Role,
      }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleRoleChange = (role: Role) => {
    setFormData((prev) => ({ ...prev, role, companyName: "" }));
    setErrors((prev) => ({ ...prev, companyName: "" }));
    if (submitError) {
      setSubmitError(null);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-z0-9_-]+$/.test(formData.username.toLowerCase())) {
      newErrors.username =
        "Username can only contain letters, numbers, underscores, and hyphens";
    }

    // Email
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Password - check all requirements
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!allPasswordRequirementsMet) {
      newErrors.password = "Password does not meet all requirements";
    }

    // Confirm Password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Company Name (for recruiters)
    if (formData.role === "RECRUITER" && !formData.companyName) {
      newErrors.companyName = "Company name is required for recruiters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      await register({
        username: formData.username.toLowerCase(),
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.role === "RECRUITER" && {
          companyName: formData.companyName,
        }),
      });

      toast.success("Account created successfully!");
      router.push("/welcome");
    } catch (error: any) {
      console.log("=== REGISTER FORM CATCH START ===");
      console.log("RAW ERROR:", error);
      console.log("ERROR TYPE:", typeof error);
      console.log("error.message:", error?.message);
      console.log("error.response:", error?.response);
      console.log("error.response?.data:", error?.response?.data);
      console.log("=== REGISTER FORM CATCH END ===");

      let message = "Registration failed. Please try again.";

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

      console.log("Final error message to UI:", message);
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange("DEVELOPER")}
              className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                formData.role === "DEVELOPER"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              )}
            >
              <FiCode className="w-5 h-5" />
              <span className="font-medium">Developer</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange("RECRUITER")}
              className={cn(
                "flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all",
                formData.role === "RECRUITER"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              )}
            >
              <FiBriefcase className="w-5 h-5" />
              <span className="font-medium">Recruiter</span>
            </button>
          </div>
        </div>

        {/* Username */}
        <Input
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="johndoe"
          error={errors.username}
          leftIcon={<FiUser className="w-5 h-5" />}
          autoComplete="username"
        />

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          error={errors.email}
          leftIcon={<FiMail className="w-5 h-5" />}
          autoComplete="email"
        />

        {/* Company Name - Only for Recruiters */}
        {formData.role === "RECRUITER" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Input
              label="Company Name"
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Acme Inc."
              error={errors.companyName}
              leftIcon={<FaBuilding className="w-5 h-5" />}
            />
          </motion.div>
        )}

        {/* Password */}
        <div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setShowPasswordRequirements(true)}
            onBlur={() => {
              if (formData.password && allPasswordRequirementsMet) {
                setShowPasswordRequirements(false);
              }
            }}
            placeholder="••••••••"
            error={errors.password}
            leftIcon={<FiLock className="w-5 h-5" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-gray-600"
              >
                {showPassword ? (
                  <FiEyeOff className="w-5 h-5" />
                ) : (
                  <FiEye className="w-5 h-5" />
                )}
              </button>
            }
            autoComplete="new-password"
          />

          {/* Password Requirements Checklist */}
          {(showPasswordRequirements || formData.password) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <p className="text-xs font-medium text-gray-600 mb-2">
                Password must contain:
              </p>
              <ul className="space-y-1">
                {passwordChecks.map((req, index) => (
                  <li
                    key={index}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      req.passed ? "text-green-600" : "text-gray-500"
                    )}
                  >
                    {req.passed ? (
                      <FiCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    ) : (
                      <FiX className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span>{req.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="••••••••"
          error={errors.confirmPassword}
          leftIcon={<FiLock className="w-5 h-5" />}
          autoComplete="new-password"
        />

        {/* Terms */}
        <p className="text-sm text-gray-500">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
        </p>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Create Account
        </Button>

        {submitError && (
          <p className="mt-3 text-sm text-red-600">{submitError}</p>
        )}

        {/* Login Link */}
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
