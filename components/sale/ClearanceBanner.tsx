'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';

export default function ClearanceBanner() {
  // Hardcoded for demo: Ends in 2 days from now
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Set target date 2 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isClient) return null;

  return (
    <div className="bg-red-700 text-white overflow-hidden relative group">
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-red-900/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
        <div className="flex-1 text-center md:text-left">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest mb-4">Limited Time Offer</span>
          <h2 className="text-3xl md:text-5xl font-serif font-bold tracking-tight mb-2">CLEARANCE SALE</h2>
          <p className="text-red-100 md:text-lg max-w-xl">Up to 70% off on premium collections. Once they are gone, they are gone forever.</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 shrink-0">
          <div className="flex items-center gap-2 bg-black/30 p-3 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xl">
            <Clock className="text-red-300 mr-2" />
            <div className="flex text-center gap-3 font-mono text-xl md:text-2xl font-bold">
              <div className="flex flex-col"><span className="text-white">{String(timeLeft.days).padStart(2, '0')}</span><span className="text-[10px] text-red-200 uppercase font-sans tracking-wider">Days</span></div>
              <span className="text-red-400 opacity-50">:</span>
              <div className="flex flex-col"><span className="text-white">{String(timeLeft.hours).padStart(2, '0')}</span><span className="text-[10px] text-red-200 uppercase font-sans tracking-wider">Hrs</span></div>
              <span className="text-red-400 opacity-50">:</span>
              <div className="flex flex-col"><span className="text-white">{String(timeLeft.minutes).padStart(2, '0')}</span><span className="text-[10px] text-red-200 uppercase font-sans tracking-wider">Mins</span></div>
              <span className="text-red-400 opacity-50">:</span>
              <div className="flex flex-col"><span className="text-white">{String(timeLeft.seconds).padStart(2, '0')}</span><span className="text-[10px] text-red-200 uppercase font-sans tracking-wider">Secs</span></div>
            </div>
          </div>
          
          <Link href="/collections/clearance" className="group/btn flex items-center gap-2 bg-white text-red-700 px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:bg-red-50 hover:shadow-lg transition-all w-full md:w-auto justify-center">
            Shop Clearance
            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
