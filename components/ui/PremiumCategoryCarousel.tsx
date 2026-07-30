"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export interface PremiumCategoryCarouselProps {
  categories: CategoryCarouselItem[];
  title?: string;
  subtitle?: string;
  isLoading?: boolean;
}


export default function PremiumCategoryCarousel({
  categories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men.",
  isLoading = false
}: PremiumCategoryCarouselProps) {
  const displayCategories = categories ?? [];
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-scroll logic for desktop only
  useEffect(() => {
    // Only run on desktop when not loading and if there are enough items
    if (isLoading || isMobile || displayCategories.length <= 4) return;

    const scrollContainer = carouselRef.current;
    if (!scrollContainer) return;

    const startAutoScroll = () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      scrollIntervalRef.current = setInterval(() => {
        if (isPaused) return;
        
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
        const maxScroll = scrollWidth - clientWidth;
        
        // If reached the end, scroll back to start smoothly
        if (scrollLeft >= maxScroll - 1) {
          scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          // Scroll by one item width (approximately)
          const itemWidth = scrollContainer.querySelector('a')?.clientWidth || 180;
          const gap = 32; // gap between items
          const scrollAmount = itemWidth + gap;
          scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }, 3000); // Scroll every 3 seconds
    };

    // Start auto-scroll after a small delay
    const timeoutId = setTimeout(startAutoScroll, 1000);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [isLoading, displayCategories.length, isMobile, isPaused]);

  // Pause on hover/touch
  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Skeleton loading state
  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-4 tracking-wide uppercase">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-500 uppercase tracking-widest">
            {subtitle}
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Skeleton */}
          <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8 justify-items-center">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center gap-4 w-full max-w-[180px] animate-pulse">
                <div className="w-full aspect-square rounded-full bg-gray-200 border-2 border-gray-100" />
                <div className="h-4 w-24 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* Desktop Skeleton */}
          <div className="hidden md:flex md:flex-nowrap md:overflow-x-hidden md:gap-8 md:pb-4 md:px-2 justify-center">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center gap-4 min-w-[140px] lg:min-w-[160px] animate-pulse">
                <div className="w-full aspect-square rounded-full bg-gray-200 border-2 border-gray-100" />
                <div className="h-4 w-28 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Clean empty state if no categories exist in database
  if (displayCategories.length === 0) {
    return (
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-4 tracking-wide uppercase">
            {title}
          </h2>
          <p className="text-sm md:text-base text-gray-500 uppercase tracking-widest mb-6">
            {subtitle}
          </p>
          <div className="py-8 px-4 rounded-lg bg-gray-50 max-w-md mx-auto border border-gray-100">
            <p className="text-sm text-gray-400 uppercase tracking-wider">No categories currently available</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-light text-gray-900 mb-4 tracking-wide uppercase">
          {title}
        </h2>
        <p className="text-sm md:text-base text-gray-500 uppercase tracking-widest">
          {subtitle}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile: Vertical grid */}
        <div className="md:hidden grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8 justify-items-center">
          {displayCategories.map((category) => (
            <CarouselItem 
              key={category.id}
              category={category}
            />
          ))}
        </div>

        {/* Desktop: Horizontal scroll with auto-scroll */}
        <div 
          ref={carouselRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleMouseEnter}
          onTouchEnd={handleMouseLeave}
          className="hidden md:flex md:flex-nowrap md:overflow-x-auto md:gap-8 md:pb-4 md:px-2 scrollbar-hide scroll-smooth"
          style={{
            scrollBehavior: 'smooth',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          {/* Duplicate items for seamless scrolling effect */}
          {[...displayCategories, ...displayCategories].map((category, index) => (
            <CarouselItem 
              key={`${category.id}-${index}`}
              category={category}
            />
          ))}
        </div>

        {/* Auto-scroll indicator (desktop only) */}
        <div className="hidden md:flex justify-center mt-8 gap-2">
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isPaused ? 'bg-gray-300' : 'bg-[#D4AF37]'}`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isPaused ? 'bg-gray-300' : 'bg-[#D4AF37] opacity-50'}`} />
          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isPaused ? 'bg-gray-300' : 'bg-[#D4AF37] opacity-25'}`} />
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

function CarouselItem({ category }: { category: CategoryCarouselItem }) {
  const href = category.redirect_link || (category.slug ? `/collections/${category.slug}` : '#');
  const imageSrc = category.image_url || '/images/category-placeholder.png';
  const altText = category.title || "Category";

  return (
    <Link 
      href={href} 
      className="block w-full max-w-[180px] md:min-w-[140px] lg:min-w-[160px] select-none outline-none group focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-4 rounded-full transition-all duration-300 hover:-translate-y-2 hover:scale-105 flex-shrink-0" 
      draggable={false}
      aria-label={`Shop ${category.title}`}
    >
      <div className="flex flex-col items-center justify-center gap-4 md:gap-5">
        <div 
          className="relative w-full aspect-square rounded-full flex items-center justify-center overflow-hidden transition-all duration-500 border-2 border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.25)] group-hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] group-hover:border-[#E8C556]"
          style={{ backgroundColor: category.bg_color || '#f5f0eb' }}
        >
          {/* Inner Glow - Gold hover effect */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(212,175,55,0.15)] group-hover:shadow-[inset_0_0_25px_rgba(212,175,55,0.4)] transition-all duration-500"></div>
          
          <Image
            src={imageSrc}
            alt={altText}
            width={120}
            height={120}
            className="w-full h-full object-cover z-10 pointer-events-none transition-transform duration-500 group-hover:scale-110"
            draggable={false}
            loading="lazy"
          />
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 uppercase tracking-widest text-center">
          {category.title}
        </h3>
      </div>
    </Link>
  );
}