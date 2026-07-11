// app/auth/error/page.tsx
export const dynamic = 'force-dynamic';

'use client';

import { Suspense } from 'react';
import AuthErrorContent from './AuthErrorContent';

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]"><div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" /></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}