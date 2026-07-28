'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ShoppingBag, CheckCircle, ShieldCheck, Truck, Sparkles, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserScratchCard } from '@/lib/repositories';

const ScratchCard = dynamic(() => import('@/components/ui/ScratchCard'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-50 rounded-2xl animate-pulse flex items-center justify-center text-xs text-gray-400">Loading your gift...</div>
});

export default function OrderSuccessPage() {
  const [orderId, setOrderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [minOrderThreshold, setMinOrderThreshold] = useState<number>(5000);
  const [userCard, setUserCard] = useState<UserScratchCard | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  useEffect(() => {
    // 1. Read cached order info
    const cachedOrder = sessionStorage.getItem('gr_last_order_number');
    let orderNum = '';
    if (cachedOrder) {
      orderNum = cachedOrder;
      setOrderId(cachedOrder);
      sessionStorage.removeItem('gr_last_order_number');
    } else {
      const num = Math.floor(100000 + Math.random() * 900000);
      orderNum = `GR-2026-${num}`;
      setOrderId(orderNum);
    }

    const cachedPayment = sessionStorage.getItem('gr_last_payment_id');
    if (cachedPayment) {
      setPaymentId(cachedPayment);
      sessionStorage.removeItem('gr_last_payment_id');
    }

    const cachedAmount = sessionStorage.getItem('gr_last_amount');
    let numAmount = 0;
    if (cachedAmount) {
      numAmount = Number(cachedAmount) || 0;
      setAmount(numAmount);
      sessionStorage.removeItem('gr_last_amount');
    }

    // 2. Fetch admin global settings and customer assigned scratch card
    async function loadCardDetails() {
      try {
        const settingsRes = await fetch('/api/scratch-cards/settings');
        const settingsData = await settingsRes.json();
        let minLimit = 5000;
        if (settingsData.success && settingsData.settings) {
          minLimit = Number(settingsData.settings.min_order_amount || 5000);
          setMinOrderThreshold(minLimit);
        }

        // Only check for user card if order amount qualifies (amount >= minLimit)
        if (numAmount >= minLimit) {
          const userCardsRes = await fetch('/api/scratch-cards/user');
          const userCardsData = await userCardsRes.json();
          if (userCardsData.success && userCardsData.cards && userCardsData.cards.length > 0) {
            // Find unrevealed card or latest assigned card
            const match = userCardsData.cards.find((c: UserScratchCard) => !c.is_claimed) || userCardsData.cards[0];
            if (match) setUserCard(match);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch scratch card info:', err);
      } finally {
        setLoadingCard(false);
      }
    }

    loadCardDetails();
  }, []);

  const handleRevealReward = async () => {
    import('canvas-confetti').then((confettiModule) => {
      confettiModule.default({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    });

    if (userCard && !userCard.is_claimed) {
      try {
        await fetch('/api/scratch-cards/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userCardId: userCard.id, userId: userCard.user_id }),
        });
      } catch (err) {
        console.warn('Error claiming reward on reveal:', err);
      }
    }
  };

  const getRewardDisplay = () => {
    if (!userCard) return '₹250 DISCOUNT';
    if (userCard.reward_type === 'percentage_discount') return `${userCard.reward_value}% OFF`;
    if (userCard.reward_type === 'free_shipping') return 'FREE SHIPPING';
    return `₹${userCard.reward_value} OFF`;
  };

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

        {/* Dynamic Scratch Card Section based on Order Threshold */}
        {!loadingCard && (
          <div className="mb-8">
            {amount >= minOrderThreshold && userCard ? (
              <div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="text-amber-500" size={16} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">You Unlocked A Scratch Card Gift!</h3>
                </div>
                <ScratchCard 
                  rewardText={getRewardDisplay()} 
                  onReveal={handleRevealReward} 
                />
              </div>
            ) : amount > 0 && amount < minOrderThreshold ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200/70 rounded-2xl text-left space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Gift size={16} className="text-amber-600" />
                  congratulations
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Spend <span className="font-bold">₹{minOrderThreshold}</span> or more on your next order to automatically unlock an exclusive Scratch Card reward!
                </p>
              </div>
            ) : null}
          </div>
        )}

        {/* Order Details box */}
        <div className="bg-[#fcfbf9] border border-gray-100 rounded-2xl p-4 mb-8 text-left space-y-3">
          <div>
            <p className="text-[10px] text-[#6b5b4b] uppercase font-bold tracking-wider mb-1">Order ID</p>
            <p className="text-sm font-semibold text-gray-900 tracking-wide">{orderId}</p>
          </div>
          {paymentId && (
            <div>
              <p className="text-[10px] text-[#6b5b4b] uppercase font-bold tracking-wider mb-1">Payment ID</p>
              <p className="text-sm font-mono text-gray-600 tracking-wide">{paymentId}</p>
            </div>
          )}
          {amount > 0 && (
            <div>
              <p className="text-[10px] text-[#6b5b4b] uppercase font-bold tracking-wider mb-1">Amount Paid</p>
              <p className="text-sm font-semibold text-green-600 tracking-wide">₹{amount}</p>
            </div>
          )}
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
            href="/orders"
            className="block w-full py-3.5 border border-gray-200 hover:border-black text-gray-700 hover:text-black rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-center"
          >
            View Orders
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
