import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#070b19] flex flex-col items-center justify-center p-6 text-center text-white relative overflow-hidden">
      {/* Background glowing radial gradients for premium look */}
      <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,#1e3a8a_0%,transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,#1d4ed8_0%,transparent_70%)] blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full space-y-8 px-4 flex flex-col items-center">
        {/* Logo */}
        <div className="mb-4 animate-fade-in">
          <Image
            src="/images/aurify-logo-black.svg"
            alt="Aurify Logo"
            width={160}
            height={40}
            className="brightness-[10] contrast-[2] opacity-90 mx-auto"
          />
        </div>

        {/* 404 Card container */}
        <div className="w-full rounded-3xl border border-slate-800/80 bg-slate-950/40 p-8 md:p-10 backdrop-blur-md shadow-[0_0_50px_-12px_rgba(30,58,138,0.3)] space-y-6">
          {/* Animated 404 Badge */}
          <div className="relative inline-flex items-center justify-center">
            <span className="text-8xl md:text-9xl font-extrabold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-600 select-none">
              404
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              Page Not Found
            </h1>
            <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md mx-auto">
              The showroom TV screen, merchant profile, or requested page could not be found. Please
              check the URL or return to safety.
            </p>
          </div>

          {/* Navigation Options */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#163db9] to-[#6287df] hover:from-[#1e4cd3] hover:to-[#7499ed] text-white text-sm font-semibold shadow-lg shadow-blue-900/40 transition-all duration-300 hover:shadow-blue-900/60 active:scale-[0.98]"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/35 hover:bg-slate-900/60 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-300 active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              Return Home
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-slate-600 text-xs tracking-wider uppercase select-none">
          © {new Date().getFullYear()} Aurify &middot; aurify.ae
        </p>
      </div>
    </main>
  );
}
