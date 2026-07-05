'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { config } from '@/lib/config';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isAuthModalOpen, closeAuthModal, loginWithGoogle, login } = useAuth();
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [view, setView] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await loginWithGoogle();
      if (res.success && res.user) {
        dispatch(
          addToast({
            message: `✓ Welcome back, ${res.user.fullName}!`,
            type: 'success',
          })
        );
      } else {
        dispatch(
          addToast({
            message: res.error || 'Failed to authenticate.',
            type: 'error',
          })
        );
      }
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.message || 'Authentication error.',
          type: 'error',
        })
      );
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      dispatch(addToast({ message: 'Please enter email and password.', type: 'error' }));
      return;
    }
    setLoadingEmail(true);
    try {
      const res = await login(email, password);
      if (res.success && res.user) {
        dispatch(
          addToast({
            message: res.user.role === 'admin'
              ? '✓ Admin Login successful!'
              : `✓ Welcome back, ${res.user.fullName}!`,
            type: 'success',
          })
        );
      } else {
        dispatch(
          addToast({
            message: res.error || 'Invalid email or password.',
            type: 'error',
          })
        );
      }
    } catch (err: any) {
      dispatch(
        addToast({
          message: err.message || 'Login error.',
          type: 'error',
        })
      );
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999] p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeAuthModal();
          }
        }}
      >
        <motion.div
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto border border-gray-100"
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {/* Close button */}
          <button
            onClick={closeAuthModal}
            className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-black transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>

          <div className="px-8 py-10 text-center space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-2xl font-serif font-bold tracking-[0.2em] uppercase text-gray-900">
                GR STYLES
              </h3>
              <p className="text-[10px] tracking-[0.3em] text-gray-400 uppercase">
                Wear your confidence
              </p>
            </div>

            {/* Middle Prompt */}
            <div className="space-y-1.5">
              <h4 className="text-base font-semibold text-gray-800">
                Sign In to Continue
              </h4>
              <p className="text-xs text-gray-400 font-light max-w-[280px] mx-auto leading-relaxed">
                Unlock checkout, order tracking, address book, and wishlist sync.
              </p>
            </div>

            {/* CTAs */}
            {view === 'google' ? (
              <div className="space-y-6 pt-2">
                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loadingGoogle}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 border border-gray-200 hover:border-black rounded-2xl text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-black bg-white hover:bg-gray-50 transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingGoogle ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.478 0 2.827.531 3.882 1.409l3.13-3.13C18.91 2.936 15.758 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.114 10.24-10.24 0-.766-.08-1.482-.22-2.185H12.24z"
                      />
                    </svg>
                  )}
                  {loadingGoogle ? 'Connecting...' : 'Continue with Google'}
                </button>

                {/* Login Here Link */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Already have an account?{' '}
                    <button
                      onClick={() => setView('email')}
                      className="font-semibold text-black underline underline-offset-2 hover:text-gray-700 transition-colors"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                
                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loadingEmail}
                    className="w-full bg-black hover:bg-gray-900 text-white py-4 rounded-2xl font-semibold text-xs uppercase tracking-wider transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                  >
                    {loadingEmail ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Login'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setView('google')}
                    className="w-full text-center text-[10px] font-bold text-gray-400 hover:text-black transition-colors py-2 block uppercase tracking-widest"
                  >
                    Back to Google Login
                  </button>
                </div>
              </form>
            )}

            {/* Footer notice */}
            <p className="text-[10px] text-gray-400 font-light pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


