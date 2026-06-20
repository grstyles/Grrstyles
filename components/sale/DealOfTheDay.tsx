"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Clock, ArrowRight, Star } from "lucide-react";

interface DealOfTheDayProps {
  categoryProducts: any[];
  activeCategoryName: string;
}

// Countdown timer hook (resets daily)
function useCountdown() {
  const getNextMidnight = () => {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return midnight;
  };

  const calculateTimeLeft = () => {
    const diff = getNextMidnight().getTime() - new Date().getTime();
    return {
      hours: Math.max(Math.floor((diff / (1000 * 60 * 60)) % 24), 0),
      minutes: Math.max(Math.floor((diff / (1000 * 60)) % 60), 0),
      seconds: Math.max(Math.floor((diff / 1000) % 60), 0),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

export default function DealOfTheDay({ categoryProducts, activeCategoryName }: DealOfTheDayProps) {
  const { hours, minutes, seconds } = useCountdown();
  const [activeIndex, setActiveIndex] = useState(0);

  // Sort products within the category to put the highest discount first
  const sortedProducts = React.useMemo(() => {
    return [...categoryProducts].sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
  }, [categoryProducts]);

  // Reset rotation index when products/category changes
  useEffect(() => {
    setActiveIndex(0);
  }, [sortedProducts]);

  // Auto-rotation every 8 seconds if there are multiple products
  useEffect(() => {
    if (sortedProducts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sortedProducts.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [sortedProducts]);

  const product = sortedProducts[activeIndex];

  if (!product) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">No sale items available in this category.</p>
      </section>
    );
  }

  const price = product.discountedPrice || product.sellingPrice || product.price || 0;
  const original = product.price || product.mrpPrice || null;
  const image = product.images?.[0] || "/placeholder.png";
  const rating = product.rating || 4.5;

  return (
    <section className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-4 animate-fadeIn">
      <div className="relative bg-gradient-to-br from-[#faf8f5] to-[#f4efe8] rounded-3xl border border-gray-200/60 p-6 md:p-10 lg:p-12 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col md:flex-row items-center gap-8 md:gap-12 min-h-[420px]">
        {/* Decorative background details */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Content Section */}
        <div className="md:w-1/2 flex flex-col items-start z-10 space-y-4 md:space-y-6 w-full">
          <div className="flex items-center gap-2 bg-[#d4af37]/10 border border-[#d4af37]/20 px-3 py-1 rounded-full text-[10px] font-bold text-[#b5952c] tracking-widest uppercase">
            <Sparkles size={12} className="animate-pulse" />
            Deal of the Day • {activeCategoryName}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 w-full"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#8b7b6b] uppercase block">
                {product.brand || "GR Styles"}
              </span>
              <h1 className="text-3xl md:text-5xl font-light tracking-tight text-gray-900 leading-tight">
                {product.title || product.name}
              </h1>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Star size={14} className="fill-[#d4af37] text-[#d4af37]" />
                  <span className="text-xs font-semibold text-gray-700 ml-1">{rating}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-500">{product.reviews || 24} reviews</span>
              </div>

              <div className="flex items-baseline gap-3 pt-2">
                <span className="text-3xl font-extrabold text-black">
                  ₹{price.toLocaleString()}
                </span>
                {original && (
                  <span className="text-base text-gray-400 line-through">
                    ₹{original.toLocaleString()}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="bg-red-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-sm animate-bounce">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${product.stockCount && product.stockCount < 10 ? 'bg-red-500 animate-ping' : 'bg-green-500'}`} />
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {product.stockCount && product.stockCount < 10 ? 'Limited Stock Remaining' : 'In Stock & Ready to Ship'}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          <Link href={`/product/${product.slug}`} className="group flex items-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-bold tracking-widest uppercase px-8 py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95">
            Shop Now
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Image Section */}
        <div className="md:w-1/2 relative w-full aspect-square md:aspect-auto md:h-[350px] z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/60">
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full"
            >
              <Image
                src={image}
                alt={product.title || product.name}
                fill
                priority
                className="object-cover hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </motion.div>
          </AnimatePresence>

          {/* Countdown Clock overlay */}
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-gray-100 flex items-center gap-2">
            <Clock size={14} className="text-red-500 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-1">Offer Ends:</span>
            <span className="text-xs font-bold font-mono text-gray-800">
              {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          {/* Auto Rotation Indicator dot indicators */}
          {sortedProducts.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/45 backdrop-blur-xs px-3 py-1.5 rounded-full flex gap-1.5 z-20">
              {sortedProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === activeIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/80'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
