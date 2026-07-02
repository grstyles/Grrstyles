"use client";

import React, { useRef, useEffect, useState, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export interface PremiumCategoryCarouselProps {
  categories: CategoryCarouselItem[];
  title?: string;
  subtitle?: string;
}

const FALLBACK_CATEGORIES: CategoryCarouselItem[] = [
  { id: '1', title: 'Shirts', slug: 'shirts', image_url: '/images/categories/shirts_1782999677203.png', bg_color: '#F5F5DC', priority: 0, featured: false, enabled: true },
  { id: '2', title: 'Printed Shirts', slug: 'printed-shirts', image_url: '/images/categories/printed_shirts_1782999700299.png', bg_color: '#F8DE7E', priority: 1, featured: false, enabled: true },
  { id: '3', title: 'Oversized T-Shirts', slug: 'oversized-t-shirts', image_url: '/images/categories/oversized_tshirts_1782999710372.png', bg_color: '#FFFDD0', priority: 2, featured: false, enabled: true },
  { id: '4', title: 'Polo T-Shirts', slug: 'polo-t-shirts', image_url: '/images/categories/polo_tshirts_1782999729942.png', bg_color: '#808000', priority: 3, featured: false, enabled: true },
  { id: '5', title: 'Trousers', slug: 'trousers', image_url: '/images/categories/trousers_1782999782089.png', bg_color: '#C2B280', priority: 4, featured: false, enabled: true },
  { id: '6', title: 'Cargo Pants', slug: 'cargo-pants', image_url: '/images/categories/cargo_pants_1782999805504.png', bg_color: '#B5651D', priority: 5, featured: false, enabled: true },
  { id: '7', title: 'Jeans', slug: 'jeans', image_url: '/images/categories/jeans_1782999835670.png', bg_color: '#1560BD', priority: 6, featured: false, enabled: true },
  { id: '8', title: 'Hoodies', slug: 'hoodies', image_url: '/images/categories/hoodies_1782999874119.png', bg_color: '#808080', priority: 7, featured: false, enabled: true },
  { id: '9', title: 'Sweatshirts', slug: 'sweatshirts', image_url: '/images/categories/sweatshirts_1782999892937.png', bg_color: '#696969', priority: 8, featured: false, enabled: true },
  { id: '10', title: 'Jackets', slug: 'jackets', image_url: '/images/categories/jackets_1782999862529.png', bg_color: '#A9A9A9', priority: 9, featured: false, enabled: true },
  { id: '11', title: 'Blazers', slug: 'blazers', image_url: '/images/categories/blazers_1781973264858.png', bg_color: '#800000', priority: 10, featured: false, enabled: true },
  { id: '12', title: 'Co-ord Sets', slug: 'co-ord-sets', image_url: '/images/categories/weekend_collection_1781859935252.png', bg_color: '#556B2F', priority: 11, featured: false, enabled: true },
  { id: '13', title: 'Shorts', slug: 'shorts', image_url: '/images/categories/beige_korean_shirt_1781860857623.png', bg_color: '#708090', priority: 12, featured: false, enabled: true },
  { id: '14', title: 'Joggers', slug: 'joggers', image_url: '/images/categories/baggy_pants_1781859636470.png', bg_color: '#2F4F4F', priority: 13, featured: false, enabled: true },
  { id: '15', title: 'Ethnic Wear', slug: 'ethnic-wear', image_url: '/images/categories/formal_wear_1781859656251.png', bg_color: '#FFDB58', priority: 14, featured: false, enabled: true },
  { id: '16', title: 'Formal Wear', slug: 'formal-wear', image_url: '/images/categories/formal_shirts_1782999741005.png', bg_color: '#000080', priority: 15, featured: false, enabled: true },
  { id: '17', title: 'Casual Wear', slug: 'casual-wear', image_url: '/images/categories/sky_blue_casual_shirt_1781860871849.png', bg_color: '#D2B48C', priority: 16, featured: false, enabled: true },
  { id: '18', title: 'Winter Collection', slug: 'winter-collection', image_url: '/images/categories/hoodies_1781973206421.png', bg_color: '#ADD8E6', priority: 17, featured: false, enabled: true },
  { id: '19', title: 'Footwear', slug: 'footwear', image_url: '/images/categories/shoes_1781859704333.png', bg_color: '#8B4513', priority: 18, featured: false, enabled: true },
  { id: '20', title: 'Sneakers', slug: 'sneakers', image_url: '/images/categories/shoes_1781859704333.png', bg_color: '#A0522D', priority: 19, featured: false, enabled: true },
  { id: '21', title: 'Loafers', slug: 'loafers', image_url: '/images/categories/shoes_1781859704333.png', bg_color: '#D2691E', priority: 20, featured: false, enabled: true },
  { id: '22', title: 'Accessories', slug: 'accessories', image_url: '/images/categories/accessories_1781859683256.png', bg_color: '#FFFFF0', priority: 21, featured: false, enabled: true },
  { id: '23', title: 'Watches', slug: 'watches', image_url: '/images/categories/watches_1781973316482.png', bg_color: '#C0C0C0', priority: 22, featured: false, enabled: true },
  { id: '24', title: 'Wallets', slug: 'wallets', image_url: '/images/categories/accessories_1781859683256.png', bg_color: '#8B0000', priority: 23, featured: false, enabled: true },
  { id: '25', title: 'Belts', slug: 'belts', image_url: '/images/categories/accessories_1781859683256.png', bg_color: '#000000', priority: 24, featured: false, enabled: true },
  { id: '26', title: 'Sunglasses', slug: 'sunglasses', image_url: '/images/categories/accessories_1781859683256.png', bg_color: '#4B0082', priority: 25, featured: false, enabled: true },
  { id: '27', title: 'Caps', slug: 'caps', image_url: '/images/categories/t_shirts_1781973106261.png', bg_color: '#483D8B', priority: 26, featured: false, enabled: true },
  { id: '28', title: 'New Arrivals', slug: 'new-arrivals', image_url: '/images/categories/premium_white_oxford_shirt_1781860824337.png', bg_color: '#FFD700', priority: 27, featured: false, enabled: true },
  { id: '29', title: 'Best Sellers', slug: 'best-sellers', image_url: '/images/categories/olive_green_linen_shirt_1781860883707.png', bg_color: '#FFA500', priority: 28, featured: false, enabled: true },
  { id: '30', title: 'Clearance Sale', slug: 'clearance-sale', image_url: '/images/categories/striped_office_shirt_1781860896799.png', bg_color: '#DC143C', priority: 29, featured: false, enabled: true },
];

export default function PremiumCategoryCarousel({
  categories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men."
}: PremiumCategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const animationRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const lastXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  const updatePosition = useCallback(() => {
    if (innerRef.current && containerRef.current) {
      // The inner container has 3 copies. We want to seamlessly loop.
      // So when we have scrolled completely through the first copy (1/3 of total scroll width),
      // we jump back to 0.
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
      
      const multiplier = delta / 16.66; // Normalize to 60fps
      
      // Mobile speed is slightly faster than desktop
      const speed = window.innerWidth < 768 ? 1.0 : 0.6;
      
      if (!isHovered && !isDraggingRef.current) {
        offsetRef.current -= speed * multiplier;
        updatePosition();
      }
      
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [isHovered, updatePosition]);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    lastXRef.current = clientX;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    const deltaX = clientX - lastXRef.current;
    lastXRef.current = clientX;
    
    offsetRef.current += deltaX;
    updatePosition();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    // Wait 2 seconds before resuming auto-scroll after a drag
    setIsHovered(true);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  };

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
        {/* Left/Right fading gradients for seamless illusion */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Drag Container */}
        <div 
          ref={containerRef}
          onMouseEnter={() => {
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            setIsHovered(true);
          }}
          onMouseLeave={() => {
            handleDragEnd(); // Catch edge case where mouse leaves while dragging
            setIsHovered(false);
          }}
          onMouseDown={(e) => handleDragStart(e.pageX)}
          onMouseMove={(e) => {
            if (isDraggingRef.current) e.preventDefault();
            handleDragMove(e.pageX);
          }}
          onMouseUp={handleDragEnd}
          onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
          onTouchEnd={handleDragEnd}
          className={`overflow-hidden pb-12 pt-4 px-8 md:px-16 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ touchAction: 'pan-y' }} // Allow vertical scrolling on mobile, hijack horizontal
        >
          {/* Inner animated track */}
          <div ref={innerRef} className="flex items-center gap-6 md:gap-10 w-max will-change-transform">
            {/* We render 3 identical sets of items to guarantee a perfect infinite loop */}
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
  // Use onClick preventDefault if dragging to stop accidental clicks
  const handleClick = (e: ReactMouseEvent) => {
    if (isDragging) {
      e.preventDefault();
    }
  };

  const href = category.redirect_link || (category.slug ? `/collections/${category.slug}` : '#');
  
  const imageSrc =
    typeof category.image_url === "string" && category.image_url.trim().length > 0
      ? category.image_url
      : "/images/category-placeholder.png";
      
  const altText = category.title || "Category";

  return (
    <Link 
      href={href} 
      className="block shrink-0 select-none outline-none group focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-4 rounded-full" 
      draggable={false}
      onClick={handleClick}
      aria-label={`Shop ${category.title}`}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <div 
          className="relative w-[95px] h-[95px] sm:w-[120px] sm:h-[120px] md:w-[140px] md:h-[140px] rounded-full overflow-hidden transition-all duration-[350ms] ease-out border-[3px] border-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.25),0_0_30px_rgba(212,175,55,0.15)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.4),0_0_40px_rgba(212,175,55,0.25)] group-hover:scale-[1.08] group-hover:border-[#E8C556]"
          style={{ backgroundColor: category.bg_color || '#f5f0eb' }}
        >
          <Image
            src={imageSrc}
            alt={altText}
            fill
            sizes="(max-width: 640px) 95px, (max-width: 768px) 120px, 140px"
            className="object-contain p-4 md:p-5 z-10 transition-transform duration-[350ms] pointer-events-none"
            draggable={false}
            loading="lazy"
          />
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-gray-900 uppercase tracking-[0.15em] text-center transition-colors">
          {category.title}
        </h3>
      </div>
    </Link>
  );
}
