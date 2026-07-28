'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface DiscountBadgeProps {
  /** Explicit text override like "₹100 OFF" or "20% OFF" */
  text?: string;
  /** Percentage discount value e.g. 20 */
  discountPercent?: number;
  /** Flat/fixed discount amount e.g. 100 */
  discountAmount?: number;
  /** Type of discount */
  discountType?: 'percentage' | 'fixed' | 'flat';
  /** Original price before discount */
  price?: number;
  /** Discounted price after discount */
  discountedPrice?: number;
  /** Badge size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Optional custom CSS classes */
  className?: string;
}

export default function DiscountBadge({
  text,
  discountPercent,
  discountAmount,
  discountType,
  price,
  discountedPrice,
  size = 'md',
  className = '',
}: DiscountBadgeProps) {
  let displayText = text;

  if (!displayText) {
    if (discountType === 'fixed' || discountType === 'flat') {
      if (discountAmount && discountAmount > 0) {
        displayText = `₹${discountAmount.toLocaleString('en-IN')} OFF`;
      }
    } else if (discountPercent && discountPercent > 0) {
      displayText = `${discountPercent}% OFF`;
    } else if (discountAmount && discountAmount > 0) {
      displayText = `₹${discountAmount.toLocaleString('en-IN')} OFF`;
    } else if (price && discountedPrice && price > discountedPrice) {
      const pct = Math.round(((price - discountedPrice) / price) * 100);
      if (pct > 0) {
        displayText = `${pct}% OFF`;
      }
    }
  }

  if (!displayText) return null;

  const sizeClasses = {
    sm: 'text-[10px] sm:text-xs px-2.5 py-1',
    md: 'text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2',
    lg: 'text-sm sm:text-base px-4 py-2 sm:px-5 sm:py-2.5',
  }[size];

  return (
    <motion.span
      initial={{ opacity: 0, y: -6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`inline-flex items-center justify-center bg-[#EF4444] text-white font-bold rounded-full shadow-md backdrop-blur-sm tracking-wide z-20 pointer-events-none select-none ${sizeClasses} ${className}`}
    >
      {displayText}
    </motion.span>
  );
}
