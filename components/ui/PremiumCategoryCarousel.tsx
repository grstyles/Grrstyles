"use client";

import React, { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export interface PremiumCategoryCarouselProps {
  categories: CategoryCarouselItem[];
  title?: string;
  subtitle?: string;
}

const FALLBACK_CATEGORIES: CategoryCarouselItem[] = [
  { id: '1', title: 'Combo Offers', slug: 'combo-offers', image_url: '/images/categories/home_hero_banner_1781859591521.png', bg_color: '#F9F7F5', priority: 0, featured: false, enabled: true },
  { id: '2', title: 'Korean Collections', slug: 'korean-collections', image_url: '/images/categories/korean_collection_1781859616593.png', bg_color: '#F9F7F5', priority: 1, featured: false, enabled: true },
  { id: '3', title: 'Baggy Pants', slug: 'baggy-pants', image_url: '/images/categories/baggy_pants_1782999816436.png', bg_color: '#F9F7F5', priority: 2, featured: false, enabled: true },
  { id: '4', title: 'Korean Trousers', slug: 'korean-trousers', image_url: '/images/categories/trousers_1781973187005.png', bg_color: '#F9F7F5', priority: 3, featured: false, enabled: true },
  { id: '5', title: 'Shoes', slug: 'shoes', image_url: '/images/categories/shoes_1781859704333.png', bg_color: '#F9F7F5', priority: 4, featured: false, enabled: true },
  { id: '6', title: 'Traditional Collections', slug: 'traditional-collections', image_url: '/images/categories/festival_wear.png', bg_color: '#F9F7F5', priority: 5, featured: false, enabled: true },
];

export default function PremiumCategoryCarousel({
  categories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men."
}: PremiumCategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  
  const animationRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const lastXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);

  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const updatePosition = useCallback(() => {
    if (innerRef.current && containerRef.current) {
      const singleSetWidth = innerRef.current.scrollWidth / 3;
      
      if (offsetRef.current <= -singleSetWidth) {
        offsetRef.current += singleSetWidth;
      } else if (offsetRef.current > 0) {
        offsetRef.current -= singleSetWidth;
      }

      innerRef.current.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    }
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    
    const step = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      const multiplier = Math.min(delta / 16.66, 2); // Cap multiplier to prevent huge jumps
      
      if (!isDraggingRef.current) {
        // Apply Momentum if there's velocity
        if (Math.abs(velocityRef.current) > 0.1) {
          offsetRef.current += velocityRef.current * multiplier;
          velocityRef.current *= 0.92; // Friction
        } else if (!isHoveredRef.current) {
          // Auto scroll
          const speed = window.innerWidth < 768 ? 1.0 : 0.6;
          offsetRef.current -= speed * multiplier;
        }
        updatePosition();
      }
      
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [updatePosition]);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    lastXRef.current = clientX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    isHoveredRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleDragMove = (clientX: number, e?: Event | React.UIEvent) => {
    if (!isDraggingRef.current) return;
    if (e && e.cancelable) e.preventDefault();
    
    const deltaX = clientX - lastXRef.current;
    
    // Calculate velocity
    const now = performance.now();
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      velocityRef.current = deltaX / dt * 15;
    }
    
    lastXRef.current = clientX;
    lastTimeRef.current = now;
    offsetRef.current += deltaX;
    updatePosition();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    resumeTimeoutRef.current = setTimeout(() => {
      isHoveredRef.current = false;
    }, 3000); // Resume after 3 seconds
  };

  const handleWheel = (e: WheelEvent) => {
    // Only handle horizontal wheel OR shift+wheel
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      e.preventDefault(); // prevent back/forward swipe nav
      isHoveredRef.current = true;
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      
      const scrollAmount = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      offsetRef.current -= scrollAmount;
      updatePosition();
      
      resumeTimeoutRef.current = setTimeout(() => {
        isHoveredRef.current = false;
      }, 3000);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, []);

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

      <div className="w-full relative group">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div 
          ref={containerRef}
          onMouseEnter={() => {
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            handleDragEnd(); 
            isHoveredRef.current = false;
          }}
          onMouseDown={(e) => handleDragStart(e.pageX)}
          onMouseMove={(e) => handleDragMove(e.pageX, e)}
          onMouseUp={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e)}
          onTouchEnd={handleDragEnd}
          className={`overflow-hidden pb-12 pt-4 px-8 md:px-16 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ touchAction: 'pan-y' }}
        >
          <div ref={innerRef} className="flex items-center gap-6 md:gap-10 w-max will-change-transform">
            {[0, 1, 2].map((setIndex) => (
              <React.Fragment key={`set-${setIndex}`}>
                {displayCategories.map((category, idx) => (
                  <CarouselItem 
                    key={`${category.id}-${idx}-${setIndex}`}
                    category={category}
                    isDragging={isDragging}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CarouselItem({ category, isDragging }: { category: CategoryCarouselItem, isDragging: boolean }) {
  const handleClick = (e: ReactMouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  const href = category.redirect_link || (category.slug ? `/collections/${category.slug}` : '#');
  const imageSrc = category.image_url || '/images/category-placeholder.png';
  const altText = category.title || "Category";

  return (
    <Link 
      href={href} 
      className="block shrink-0 select-none outline-none group focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-4 rounded-full transition-all duration-300 hover:-translate-y-2 hover:scale-105" 
      draggable={false}
      onClick={handleClick}
      aria-label={`Shop ${category.title}`}
    >
      <div className="flex flex-col items-center justify-center gap-4 md:gap-5">
        <div 
          className="relative w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] rounded-full flex items-center justify-center transition-all duration-500 border-2 border-[#D4AF37] shadow-[0_4px_15px_rgba(212,175,55,0.25)] group-hover:shadow-[0_8px_30px_rgba(212,175,55,0.6)] group-hover:border-[#E8C556]"
          style={{ backgroundColor: category.bg_color || '#f5f0eb' }}
        >
          {/* Inner Glow - Gold hover effect */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(212,175,55,0.15)] group-hover:shadow-[inset_0_0_25px_rgba(212,175,55,0.4)] transition-all duration-500"></div>
          
          <Image
            src={imageSrc}
            alt={altText}
            width={120}
            height={120}
            className="w-[85%] h-[85%] object-cover p-2 md:p-3 mix-blend-multiply z-10 pointer-events-none transition-transform duration-500 group-hover:scale-110"
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
