'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Gift, Sparkles, X, Copy, Check, Ticket, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserScratchCard } from '@/lib/repositories';

interface ScratchCardModalProps {
  card: UserScratchCard;
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (updatedCard: UserScratchCard) => void;
}

export default function ScratchCardModal({ card, isOpen, onClose, onRewardClaimed }: ScratchCardModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(card.is_scratched || card.is_claimed);
  const [isClaimed, setIsClaimed] = useState(card.is_claimed);
  const [scratchPercent, setScratchPercent] = useState(card.is_scratched ? 100 : 0);
  const [claiming, setClaiming] = useState(false);
  const [couponCode, setCouponCode] = useState(card.coupon_code || '');
  const [copied, setCopied] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');

  // Setup canvas overlay
  useEffect(() => {
    if (!isOpen || isRevealed) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Base fill
      const overlayColor = card.scratch_overlay_color || '#2c2c2c';
      ctx.fillStyle = overlayColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Noise/Metallic texture
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#1a1a1a' : '#444444';
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }

      // Shimmer lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 3;
      for (let i = -100; i < canvas.width + 100; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 80, canvas.height);
        ctx.stroke();
      }

      // Text overlay
      ctx.fillStyle = '#facc15'; // Gold
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SCRATCH TO REVEAL', canvas.width / 2, canvas.height / 2 + 6);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, isRevealed, card]);

  const handleScratch = (e: any) => {
    if (isRevealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkRevealProgress();
  };

  const checkRevealProgress = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparentCount++;
    }

    const percent = Math.round((transparentCount / (pixels.length / 4)) * 100);
    setScratchPercent(percent);

    if (percent > 40 && !isRevealed) {
      setIsRevealed(true);
      if (canvas) {
        canvas.style.transition = 'opacity 0.4s ease-out';
        canvas.style.opacity = '0';
        setTimeout(() => {
          canvas.style.pointerEvents = 'none';
        }, 400);
      }
      autoClaimOnServer();
    }
  };

  const autoClaimOnServer = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/scratch-cards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardId: card.id, userId: card.user_id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsClaimed(true);
        if (data.coupon_code) setCouponCode(data.coupon_code);
        setRewardMsg(data.message || 'Reward claimed!');
        if (onRewardClaimed) {
          onRewardClaimed({ ...card, is_scratched: true, is_claimed: true, coupon_code: data.coupon_code });
        }
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
    } finally {
      setClaiming(false);
    }
  };

  const copyCodeToClipboard = () => {
    if (!couponCode) return;
    navigator.clipboard.writeText(couponCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative border border-gray-100 flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div
          className="w-full p-6 text-center text-white relative"
          style={{ backgroundColor: card.bg_color || '#1e1b4b' }}
        >
          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur mb-2">
            <Gift className="text-amber-300" size={32} />
          </div>
          <h3 className="text-xl font-bold font-serif">{card.card_title || 'Your Lucky Scratch Card'}</h3>
          <p className="text-xs opacity-80 mt-1">{card.card_subtitle || 'Scratch to reveal your exclusive reward!'}</p>
        </div>

        {/* Scratch Area Container */}
        <div className="p-6 w-full flex flex-col items-center">
          <div className="relative w-[300px] h-[160px] rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-400/30 bg-gradient-to-br from-amber-50 to-orange-100">
            {/* Underlying Revealed Reward */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <Sparkles className="text-amber-500 mb-1 animate-bounce" size={28} />
              <div className="text-2xl font-black text-gray-900 tracking-tight">
                {card.reward_type === 'percentage_discount' ? `${card.reward_value}% OFF` : `₹${card.reward_value} OFF`}
              </div>
              <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mt-1">
                {card.reward_details?.description || 'Instant Discount Reward'}
              </p>
            </div>

            {/* Sparkles celebration overlay */}
            {isRevealed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
              >
                <Sparkles className="text-yellow-500 absolute top-3 left-4 animate-ping" size={20} />
                <Sparkles className="text-amber-600 absolute bottom-3 right-4 animate-pulse" size={24} />
              </motion.div>
            )}

            {/* Interactive Scratch Canvas */}
            {!isRevealed && (
              <canvas
                ref={canvasRef}
                width={300}
                height={160}
                className="absolute inset-0 w-full h-full cursor-pointer touch-none"
                onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                onTouchMove={handleScratch}
              />
            )}
          </div>

          {/* Progress Indicator */}
          {!isRevealed && (
            <div className="w-full mt-4 flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-200" style={{ width: `${scratchPercent}%` }} />
              </div>
              <span className="text-xs font-bold text-gray-500">{scratchPercent}%</span>
            </div>
          )}

          {/* Claim & Code Display */}
          {isRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-6 space-y-4 text-center"
            >
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between gap-2">
                <div className="text-left">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block tracking-wider">
                    Coupon Code Unlocked
                  </span>
                  <span className="font-mono text-lg font-black text-gray-900 tracking-wider">
                    {couponCode || 'WELCOME200'}
                  </span>
                </div>

                <button
                  onClick={copyCodeToClipboard}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check size={14} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Copy Code
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 font-medium">
                Use this coupon code at checkout to claim your ₹{card.reward_value} discount!
              </p>

              <button
                onClick={onClose}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-md"
              >
                Use Coupon Now
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
