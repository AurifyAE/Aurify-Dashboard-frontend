'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { useSearchParams, useRouter } from 'next/navigation';

interface FieldErrors {
  email?: string;
  password?: string;
}

function LoginContent() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (searchParams?.get('alert') === 'deleted') {
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your account has been suspended or deleted by the administrator.',
        confirmButtonColor: '#4A90E2',
      });
      // Clear the query param so the popup doesn't fire again on re-render
      router.replace('/login');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Client-side validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setApiError(''); // optional — you can keep or remove banner
    setFieldErrors({}); // clear previous field errors

    if (!validate()) return;

    setIsLoading(true);

    try {
      const res = await login(email, password);

      if (res.success) {
        // ── Success case ─────────────────────────────────────
        await Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome back to Aurify',
          showConfirmButton: false,
          timer: 1000, // disappears after 1.8 seconds
        });

        // Note: AuthContext probably already redirects → no need to do it here
      } else {
        // ── Failure cases ─────────────────────────────────────
        if (res.errors) {
          // 422 validation errors from server → show in fields
          setFieldErrors(res.errors as FieldErrors);

          await Swal.fire({
            icon: 'warning',
            title: 'Validation Error',
            text: 'Please check the highlighted fields',
          });
        } else {
          // General login failure (wrong credentials, etc.)
          await Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: res.message || 'Invalid email or password. Please try again.',
          });
        }
      }
    } catch (err) {
      console.error('Login Error:', err);

      // Network / unexpected error
      await Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect. Please check your network and try again.',
        confirmButtonColor: '#4A90E2',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for input class — shows red border on error
  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-[11px] text-[14px] border rounded-[6px] focus:outline-none focus:ring-1 transition-all text-[#374151] placeholder-[#9CA3AF] bg-white ${
      fieldErrors[field]
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border-[#D1D5DB] focus:ring-[#4A90E2] focus:border-[#4A90E2]'
    }`;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side */}
      <div className="hidden relative overflow-hidden lg:flex lg:w-3/5 bg-[#000000]">
        <div className="">
          <Image
            src={'/images/bg.png'}
            height={800}
            width={1000}
            alt=""
            className="w-full h-full   object-cover"
          />
        </div>
      </div>
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-2/5 flex relative items-center justify-center bg-white relative">
        <img
          src={'/images/aurify-logo1.svg'}
          alt="Background"
          className="object-cover h-full pointer-events-none object-contain absolute top-0 -right-[40%] opacity-1   brightness-0 grayscale-100  "
        />

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
            <h1 className="text-[26px] font-semibold text-[#2C3E50] mb-2">Welcome Back</h1>
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
              <label htmlFor="email" className="block text-[13px] font-medium text-[#374151] mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  setApiError('');
                }}
                placeholder="Enter your email"
                className={inputClass('email')}
                autoComplete="email"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[12px] text-red-500">{fieldErrors.email}</p>
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
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password)
                      setFieldErrors((p) => ({ ...p, password: undefined }));
                    setApiError('');
                  }}
                  placeholder="Enter your password"
                  className={`${inputClass('password')} pr-11`}
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
                <p className="mt-1 text-[12px] text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            {/* Forgot Password */}
            {/* <div className="flex justify-end -mt-1">
              <a
                href="/forgot-password"
                className="text-[13px] text-[#4A90E2] hover:text-[#3A7BC8] transition-colors"
              >
                Forgot Password?
              </a>
            </div> */}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full overflow-hidden bg-transparent py-[17px] rounded-[6px] text-white text-[13px] tracking-[0.26em] uppercase flex items-center justify-center gap-[10px] transition-[filter] duration-300 hover:brightness-[1.08] active:scale-[0.994] group"
              style={{
                fontFamily: "'Tenor Sans', serif",
                background: 'linear-gradient(90deg, #163db9 0%, #6287df 100%)',
                border: 'none',
              }}
            >
              <span
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg,transparent,rgba(255,255,255,0.8) 50%,transparent)',
                }}
              />
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-[650ms] ease-in-out"
                style={{
                  background:
                    'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.14) 50%,transparent 65%)',
                }}
              />
              {isLoading ? (
                <>
                  <span className="w-[13px] h-[13px] rounded-full border-[1.5px] border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <span className=" text-[9px]">✦</span>Login
                  <span className=" text-[9px]">✦</span>
                </>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
