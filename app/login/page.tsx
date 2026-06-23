'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { authService } from '@/services/authService';
import { config } from '@/lib/config';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ message: 'Please enter email and password.', type: 'error' }));
      return;
    }

    setLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.success && res.user) {
        dispatch(addToast({
          message: res.user.role === 'admin'
            ? '✓ Admin login successful! Welcome back.'
            : 'Logged in successfully!',
          type: 'success',
        }));
        router.push(res.user.role === 'admin' ? '/admin' : '/profile');
      } else {
        dispatch(addToast({ message: res.error || 'Invalid credentials.', type: 'error' }));
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'An error occurred during sign in.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail(config.adminEmail);
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-[#f9f7f5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-serif font-bold tracking-[0.2em] text-gray-900 uppercase">GR STYLES</h1>
            <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase mt-1">Men's Fashion Store</p>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header stripe */}
          <div className="bg-black px-8 py-6">
            <h2 className="text-white font-semibold text-lg tracking-wider uppercase">Sign In</h2>
            <p className="text-gray-400 text-xs mt-1">Access your account or admin panel</p>
          </div>

          <div className="px-8 py-8 space-y-5">
            {/* Demo Admin Banner */}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left group hover:border-amber-400 transition-colors"
            >
              <div className="p-2 bg-amber-100 rounded-xl text-amber-600 flex-shrink-0">
                <ShieldCheck size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Demo Admin Mode</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Click to auto-fill admin email</p>
              </div>
              <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300 transition-colors"
                  />
                  <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-11 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-black text-sm placeholder-gray-300 transition-colors"
                  />
                  <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm uppercase tracking-wider transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>Sign In <ArrowRight size={14} /></>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs text-gray-400">or</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-sm text-gray-500">
              New customer?{' '}
              <Link href="/register" className="text-black font-semibold hover:underline underline-offset-2">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials info */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-[11px] text-gray-400">Demo Admin Email</p>
          <p className="text-[11px] font-mono text-gray-500 bg-gray-100 rounded-lg inline-block px-4 py-1.5">
            {config.adminEmail}
          </p>
        </div>
      </div>
    </div>
  );
}
