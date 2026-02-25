"use client";

import React, { useState, FormEvent } from "react";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (!res.success) {
        // Server-side field errors (422)
        if (res.errors) {
          setFieldErrors(res.errors as FieldErrors);
        } else {
          setApiError(res.message || "Login failed. Please try again.");
        }
      }
      // On success, AuthContext redirects to /dashboard automatically
    } catch {
      setApiError(
        "Unable to connect. Please check your network and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for input class — shows red border on error
  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-[11px] text-[14px] border rounded-[6px] focus:outline-none focus:ring-1 transition-all text-[#374151] placeholder-[#9CA3AF] bg-white ${
      fieldErrors[field]
        ? "border-red-400 focus:ring-red-400 focus:border-red-400"
        : "border-[#D1D5DB] focus:ring-[#4A90E2] focus:border-[#4A90E2]"
    }`;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side */}
      <div className="hidden lg:flex lg:w-3/5 bg-[#CBCFD4] relative">
        <div className="bg_overlay">
          <Image
            src={"/images/background.svg"}
            height={800}
            width={1000}
            alt=""
          />
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white relative">
        <div className="w-full max-w-[500px] px-8 py-12">
          {/* Logo */}
          <div className="mb-5">
            <div className="h-auto w-50 mb-6">
              <Image
                src="/images/aurify-logo-black.svg"
                alt="Aurify Logo"
                height={500}
                width={500}
              />
            </div>
            <h1 className="text-[26px] font-semibold text-[#2C3E50] mb-2">
              Welcome Back
            </h1>
            <p className="text-[13px] text-[#6B7280] leading-relaxed">
              Login to access your trading dashboards and manage content
            </p>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-[6px] flex items-start gap-2">
              <span className="text-red-500 text-[13px] font-medium">⚠</span>
              <p className="text-red-600 text-[13px]">{apiError}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-medium text-[#374151] mb-2"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email)
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                  setApiError("");
                }}
                placeholder="Enter your email"
                className={inputClass("email")}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[12px] text-red-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-medium text-[#374151] mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    setApiError("");
                  }}
                  placeholder="Enter your password"
                  className={`${inputClass("password")} pr-11`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors p-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-[12px] text-red-500">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end -mt-1">
              <a
                href="/forgot-password"
                className="text-[13px] text-[#4A90E2] hover:text-[#3A7BC8] transition-colors"
              >
                Forgot Password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4067B1] hover:bg-[#1a356d] disabled:bg-[#9ab0d9] disabled:cursor-not-allowed text-white py-[13px] rounded-[6px] font-medium transition-all duration-200 text-[15px] mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in…
                </>
              ) : (
                "Login"
              )}
            </button>

            {/* Register Link */}
            <div className="text-center pt-2">
              <span className="text-[15px] text-[#6B7280]">New here? </span>
              <a
                href="/register"
                className="text-[15px] text-[#4A90E2] hover:text-[#012653] transition-colors font-medium"
              >
                Register
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
