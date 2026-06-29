'use client';

import React, { useState, FormEvent } from 'react';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '@/context/AuthContext';
import { useHasMounted } from '@/lib/useHasMounted';

interface FieldErrors {
  companyName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

type RegisterForm = {
  companyName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  logo?: string;
  services: {
    tvDisplay: boolean;
    website: boolean;
    mobileApp: boolean;
  };
};

export default function RegisterPage() {
  const { register } = useAuth();
  const mounted = useHasMounted();

  const [form, setForm] = useState<RegisterForm>({
    companyName: '',
    email: '',
    phone: undefined,
    password: '',
    confirmPassword: '',
    logo: undefined,
    services: {
      tvDisplay: true, // Default checked
      website: false,
      mobileApp: false,
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleScroll = () => {
    if (formRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = formRef.current;
      setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 10);
    }
  };

  // Initial check
  React.useEffect(() => {
    handleScroll();
  }, [form.logo]); // Re-check if logo adds height

  const updateField = <K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (fieldErrors[key as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
    setApiError('');
  };

  // ── Client-side validation ───────────────────────────────────────────────
  const validate = (): boolean => {
    const errors: FieldErrors = {};
    if (!form.companyName.trim()) errors.companyName = 'Company name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!form.phone?.trim()) errors.phone = 'Phone number is required';
    if (!form.password) {
      errors.password = 'Password is required';
    } else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await register(form);
      if (!res.success) {
        if (res.errors) {
          setFieldErrors(res.errors as FieldErrors);
        } else {
          setApiError(res.message || 'Registration failed. Please try again.');
        }
      }
      // On success, AuthContext redirects to /dashboard
    } catch {
      setApiError('Unable to connect. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable input class with error styling
  const inputClass = (field: keyof FieldErrors) =>
    `w-full px-4 py-[11px] text-[14px] border rounded-[6px] focus:outline-none focus:ring-1 transition-all text-[#374151] placeholder-[#9CA3AF] bg-white ${
      fieldErrors[field]
        ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
        : 'border-[#D1D5DB] focus:ring-[#4A90E2] focus:border-[#4A90E2]'
    }`;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left */}
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

      {/* Right */}
      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white overflow-y-auto">
        <div className="w-full max-w-[500px] px-8 py-12">
          {/* Logo */}
          <div className="mb-6">
            <Image src="/images/aurify-logo-black.svg" alt="Aurify Logo" width={180} height={40} />
          </div>

          {/* Header */}
          <h1 className="text-[26px] font-semibold text-[#2C3E50] mb-2">Create Your Account</h1>
          <p className="text-[13px] text-[#6B7280] mb-6">
            Thousands of jewelers managing live display and gold rates
          </p>

          {/* API Error Banner */}
          {apiError && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-[6px] flex items-start gap-2">
              <span className="text-red-500 text-[13px] font-medium">⚠</span>
              <p className="text-red-600 text-[13px]">{apiError}</p>
            </div>
          )}

          <div className="relative">
            <form
              ref={formRef}
              onScroll={handleScroll}
              onSubmit={handleRegister}
              className="space-y-5 mb-6 max-h-[60dvh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pr-2"
              noValidate
            >
              {/* Company Name */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder="Enter your company name"
                  className={inputClass('companyName')}
                />
                {fieldErrors.companyName && (
                  <p className="mt-1 text-[12px] text-red-500">{fieldErrors.companyName}</p>
                )}
              </div>

              {/* Company Logo */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Company Logo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-[13px] text-[#6B7280] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {form.logo && (
                  <div className="mt-3">
                    <Image
                      src={form.logo}
                      alt="Preview"
                      width={80}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="Enter your email"
                  className={inputClass('email')}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-[12px] text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div
                  className={`flex items-center border rounded-[6px] h-[48px] px-3 focus-within:ring-1 ${
                    fieldErrors.phone
                      ? 'border-red-400 focus-within:ring-red-400'
                      : 'border-[#D1D5DB] focus-within:ring-[#4A90E2]'
                  }`}
                >
                  {mounted ? (
                    <PhoneInput
                      international
                      withCountryCallingCode
                      defaultCountry="IN"
                      value={form.phone}
                      onChange={(value) => updateField('phone', value)}
                      className="flex w-full phone-input-unified"
                    />
                  ) : (
                    <input
                      readOnly
                      placeholder="Phone number"
                      className="w-full border-0 bg-transparent text-[14px] text-[#9CA3AF] outline-none"
                    />
                  )}
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-[12px] text-red-500">{fieldErrors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    placeholder="Min. 8 characters"
                    className={`${inputClass('password')} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-[12px] text-red-500">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    placeholder="Re-enter your password"
                    className={`${inputClass('confirmPassword')} pr-11`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-[12px] text-red-500">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              {/* Requested Services */}
              <div>
                <label className="block text-[13px] font-medium text-[#374151] mb-3">
                  Requested Services <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-6">
                  {[
                    { id: 'tvDisplay', label: 'TV Screen' },
                    { id: 'website', label: 'Website' },
                    { id: 'mobileApp', label: 'Mobile App' },
                  ].map((service) => (
                    <label key={service.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.services[service.id as keyof typeof form.services]}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            services: {
                              ...prev.services,
                              [service.id]: e.target.checked,
                            },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                      />
                      <span className="text-[13px] text-[#374151] font-medium">
                        {service.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="sticky bottom-0 w-full overflow-hidden py-[17px] rounded-[6px] text-white text-[13px] tracking-[0.26em] uppercase flex items-center justify-center gap-[10px] transition-[filter] duration-300 hover:brightness-[1.08] active:scale-[0.994] disabled:opacity-70 disabled:cursor-not-allowed group"
                style={{
                  fontFamily: "'Tenor Sans', serif",
                  background: 'linear-gradient(90deg, #163db9 0%, #6287df 100%)',
                  border: 'none',
                }}
              >
                {/* Top Highlight */}
                <span
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg,transparent,rgba(255,255,255,0.8) 50%,transparent)',
                  }}
                />

                {/* Shine Effect */}
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="text-[9px]">✦</span>
                    Create Account
                    <span className="text-[9px]">✦</span>
                  </>
                )}
              </button>
            </form>

            {/* Scroll Down Indicator */}
            {!isScrolledToBottom && (
              <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 pointer-events-none animate-bounce bg-white/80 p-1.5 rounded-full shadow-sm border border-slate-100 backdrop-blur-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center pt-4">
            <span className="text-[15px] text-[#6B7280]">Already Have an Account? </span>
            <a
              href="/login"
              className="text-[15px] text-[#4A90E2] hover:text-[#012653] transition-colors font-medium"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
