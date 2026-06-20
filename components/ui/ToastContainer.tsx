'use client';

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { removeToast } from '@/lib/redux/slices/uiSlice';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastItemProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

function ToastItem({ id, message, type }: ToastItemProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(removeToast(id));
    }, 3500);

    return () => clearTimeout(timer);
  }, [id, dispatch]);

  const config = {
    success: {
      bg: 'bg-white border-green-200',
      icon: <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" />,
      text: 'text-gray-800',
    },
    error: {
      bg: 'bg-white border-red-200',
      icon: <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />,
      text: 'text-gray-800',
    },
    info: {
      bg: 'bg-white border-blue-200',
      icon: <Info className="text-blue-500 w-5 h-5 flex-shrink-0" />,
      text: 'text-gray-800',
    },
  };

  const currentConfig = config[type] || config.info;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full backdrop-blur-md bg-white/95 ${currentConfig.bg}`}
    >
      {currentConfig.icon}
      <p className={`text-xs font-medium flex-1 leading-relaxed ${currentConfig.text}`}>
        {message}
      </p>
      <button
        onClick={() => dispatch(removeToast(id))}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector((state: RootState) => state.ui.toasts);

  return (
    <div className="fixed top-24 right-4 sm:right-6 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <div className="flex flex-col gap-2 w-full pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
