'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, CheckCircle, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderSuccessPage() {
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    // Check if we have a cached order number from checkout, otherwise fallback to random
    const cachedOrder = sessionStorage.getItem('gr_last_order_number');
    if (cachedOrder) {
      setOrderId(cachedOrder);
      // Clean up cache
      sessionStorage.removeItem('gr_last_order_number');
    } else {
      const num = Math.floor(100000 + Math.random() * 900000);
      setOrderId(`GR-2026-${num}`);
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#fcfbf9] py-16 sm:py-24 px-4 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-md text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={44} className="stroke-[1.5]" />
        </motion.div>

        <h1 className="text-3xl font-light text-[#1a1a1a] mb-2 tracking-tight">Order Confirmed</h1>
        <p className="text-sm text-[#6b5b4b] mb-6">
          Thank you for shopping with GR STYLES. Your order has been placed successfully.
        </p>

        {/* Order ID box */}
        <div className="bg-[#fcfbf9] border border-gray-100 rounded-2xl p-4 mb-8">
          <p className="text-xs text-[#6b5b4b] uppercase font-bold tracking-wider mb-1">Order Identifier</p>
          <p className="text-lg font-serif font-semibold text-gray-900 tracking-wide">{orderId}</p>
        </div>

        <div className="space-y-4 text-left border-t border-gray-100 pt-6 mb-8 text-xs text-[#6b5b4b]">
          <div className="flex gap-3">
            <Truck size={16} className="text-[#8b7b6b] flex-shrink-0" />
            <div>
              <p className="font-semibold text-[#1a1a1a]">Estimated Delivery</p>
              <p>Your order will be shipped within 24-48 hours and arrive in 3-5 business days.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldCheck size={16} className="text-[#8b7b6b] flex-shrink-0" />
            <div>
              <p className="font-semibold text-[#1a1a1a]">Order Confirmation</p>
              <p>A shipping confirmation email with tracking details will be sent shortly.</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Continue Shopping
          </Link>
          <Link
            href="/lookbook"
            className="block w-full py-3.5 border border-gray-200 hover:border-black text-gray-700 hover:text-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-center"
          >
            Explore Lookbook
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
