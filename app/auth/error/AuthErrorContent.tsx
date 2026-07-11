// app/auth/error/AuthErrorContent.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';

export default function AuthErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const message = searchParams.get('message');
    setErrorMessage(message ? decodeURIComponent(message) : 'Authentication failed. Please try again.');
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm border border-[#EAEAEA] text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-2xl font-light font-playfair text-[#111111] mb-2">
          Authentication Failed
        </h1>

        <p className="text-sm text-[#777777] font-light leading-relaxed mb-6">
          {errorMessage}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-[#111111] text-[#111111] text-[11px] tracking-[0.2em] uppercase font-light hover:bg-[#111111] hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#D4AF37] text-white text-[11px] tracking-[0.2em] uppercase font-light hover:bg-[#C19B2E] transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Link>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-[#EAEAEA] text-[#777777] text-[11px] tracking-[0.2em] uppercase font-light hover:border-[#111111] hover:text-[#111111] transition-all duration-300"
          >
            <Home className="w-4 h-4" />
            Home
          </Link>
        </div>

        <p className="text-[10px] text-[#999999] font-light mt-6">
          If the problem persists, please contact our support team.
        </p>
      </motion.div>
    </div>
  );
}