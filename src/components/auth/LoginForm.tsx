/**
 * @file src/components/auth/LoginForm.tsx
 * @description Login form component with validation + backend error handling
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiEye, FiEyeOff, FiGithub } from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { Button, Input } from "@/components/common";
import { isValidEmail } from "@/lib/utils";

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
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
      await login(formData.email, formData.password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (error: any) {
      console.log("LOGIN ERROR:", error);

      let message = "Login failed. Please try again.";

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message) {
        message = error.message;
      }

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

        {/* Password */}
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleChange}
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
          autoComplete="current-password"
        />

        {/* Forgot Password */}
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Sign In
        </Button>

        {/* Backend error message */}
        {submitError && (
          <p className="mt-3 text-sm text-red-600">{submitError}</p>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          leftIcon={<FiGithub className="w-5 h-5" />}
          onClick={() => toast.error("GitHub OAuth coming soon!")}
        >
          GitHub
        </Button>

        {/* Register Link */}
        <p className="text-center text-gray-600 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign up
          </Link>
        </p>
      </form>
    </motion.div>
  );
}
