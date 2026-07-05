'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { authService } from '@/services/authService';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      dispatch(addToast({ message: 'All fields are required.', type: 'error' }));
      return;
    }

    if (password !== confirmPassword) {
      dispatch(addToast({ message: 'Passwords do not match.', type: 'error' }));
      return;
    }

    setLoading(true);
    try {
      // Auto-assign admin role if email contains "admin" for convenience and developer demo/admin tests
      const role = email.toLowerCase().includes('admin') ? 'admin' : 'customer';
      const res = await authService.register(email, password, fullName, role);
      
      if (res.success) {
        dispatch(addToast({ message: 'Account created successfully! Please log in.', type: 'success' }));
        router.push('/login');
      } else {
        dispatch(addToast({ message: res.error || 'Failed to register account.', type: 'error' }));
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'An error occurred during registration.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-gray-600">Join GR STYLES today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Full Name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:bg-gray-400"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-xs text-gray-500">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            try {
              setLoading(true);
              const res = await authService.loginWithGoogle();
              if (!res.success) {
                dispatch(addToast({ message: res.error || 'Google signup failed.', type: 'error' }));
              }
            } catch (err: any) {
              dispatch(addToast({ message: err.message || 'Google signup failed.', type: 'error' }));
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 py-3 rounded-lg border-2 border-gray-200 font-bold transition-colors disabled:opacity-50 mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Sign up with Google
        </button>

        <div className="text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-black font-bold hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

