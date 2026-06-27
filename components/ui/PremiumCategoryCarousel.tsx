"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoryImage, normalizeSlug } from "@/lib/utils/categoryImageMap";
import { motion, useAnimationFrame, useMotionValue, PanInfo } from "framer-motion";

export interface PremiumCategoryCarouselProps {
  categories: string[];
  title?: string;
  subtitle?: string;
}

export default function PremiumCategoryCarousel({
  categories: originalCategories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men."
}: PremiumCategoryCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [itemWidth, setItemWidth] = useState(200);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const x = useMotionValue(0);
  const activeIndex = useMotionValue(0);
  const [activeDot, setActiveDot] = useState(0);

  const baseVelocity = -0.5;

  // Duplicate the array to allow seamless scrolling
  const categories = [...originalCategories, ...originalCategories, ...originalCategories];
  const ITEMS_COUNT = originalCategories.length;

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth < 640) setItemWidth(140);
      else if (window.innerWidth < 1024) setItemWidth(180);
      else setItemWidth(220);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useAnimationFrame((t, delta) => {
    if (isHovered || isDragging) return;

    let moveBy = baseVelocity * (delta / 16);
    let currentX = x.get();
    
    const setWidth = itemWidth * ITEMS_COUNT;
    let newX = currentX + moveBy;

    if (newX <= -setWidth) {
      newX += setWidth;
    } else if (newX > 0) {
      newX -= setWidth;
    }

    x.set(newX);

    const screenCenter = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
    const offsetInSet = (-newX + screenCenter - itemWidth / 2) % setWidth;
    let closestIndex = Math.round(offsetInSet / itemWidth);
    
    if (closestIndex < 0) closestIndex += ITEMS_COUNT;
    closestIndex = closestIndex % ITEMS_COUNT;

    activeIndex.set(closestIndex);
    if (closestIndex !== activeDot) {
      setActiveDot(closestIndex);
    }
  });

  const handleDragEnd = (e: any, info: PanInfo) => {
    setIsDragging(false);
  };

  const handleDrag = (e: any, info: PanInfo) => {
    let newX = x.get() + info.delta.x;
    const setWidth = itemWidth * ITEMS_COUNT;
    
    if (newX <= -setWidth) newX += setWidth;
    else if (newX > 0) newX -= setWidth;
    
    x.set(newX);

    const screenCenter = window.innerWidth / 2;
    const offsetInSet = (-newX + screenCenter - itemWidth / 2) % setWidth;
    let closestIndex = Math.round(offsetInSet / itemWidth);
    if (closestIndex < 0) closestIndex += ITEMS_COUNT;
    closestIndex = closestIndex % ITEMS_COUNT;
    if (closestIndex !== activeDot) {
      setActiveDot(closestIndex);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-light text-[#1a1a1a] mb-4 tracking-wide">
          {title}
        </h2>
        <p className="text-sm md:text-base text-[#6b5b4b]">
          {subtitle}
        </p>
      </div>

      <div 
        className="relative w-full overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing pb-8"
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsDragging(false);
        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaX) > 0) {
            let newX = x.get() - e.deltaX * 0.5;
            const setWidth = itemWidth * ITEMS_COUNT;
            if (newX <= -setWidth) newX += setWidth;
            else if (newX > 0) newX -= setWidth;
            x.set(newX);
          }
        }}
      >
        <motion.div 
          className="flex items-center w-max"
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {categories.map((category, idx) => {
            const slug = normalizeSlug(category);
            const img = getCategoryImage(category);
            
            return (
              <CarouselItem 
                key={`${slug}-${idx}`}
                category={category}
                slug={slug}
                img={img}
                idx={idx}
                itemWidth={itemWidth}
                x={x}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Pagination Dots */}
      <div className="flex justify-center items-center gap-2 mt-4">
        {originalCategories.map((_, idx) => (
          <button
            key={idx}
            className={`transition-all duration-300 rounded-full ${
              activeDot === idx 
                ? 'w-2.5 h-2.5 bg-black' 
                : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to category ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function CarouselItem({ category, slug, img, idx, itemWidth, x }: {
  category: string;
  slug: string;
  img: string;
  idx: number;
  itemWidth: number;
  x: any;
}) {
  const [scale, setScale] = useState(0.85);
  const [opacity, setOpacity] = useState(0.7);

  useAnimationFrame(() => {
    if (typeof window === 'undefined') return;
    
    const screenCenter = window.innerWidth / 2;
    const itemCenter = x.get() + (idx * itemWidth) + (itemWidth / 2);
    const dist = Math.abs(screenCenter - itemCenter);
    
    let newScale = 0.85;
    let newOpacity = 0.7;

    if (dist < itemWidth) {
      const progress = dist / itemWidth;
      newScale = 1 - (progress * 0.08); 
      newOpacity = 1 - (progress * 0.1);
    } else if (dist < itemWidth * 2) {
      const progress = (dist - itemWidth) / itemWidth;
      newScale = 0.92 - (progress * 0.07);
      newOpacity = 0.9 - (progress * 0.2);
    }

    setScale(Number(newScale.toFixed(3)));
    setOpacity(Number(newOpacity.toFixed(3)));
  });

  return (
    <Link href={`/category/${slug}`} className="block select-none" draggable={false}>
      <motion.div 
        className="flex flex-col items-center justify-center gap-4 transition-all"
        style={{ 
          width: itemWidth,
          scale,
          opacity
        }}
      >
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow duration-300 bg-[#f5f0eb] border border-gray-100">
          <Image
            src={img}
            alt={category}
            fill
            sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 176px"
            className="object-cover hover:scale-105 transition-transform duration-500"
            draggable={false}
          />
        </div>
        <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-800 uppercase tracking-widest text-center">
          {category}
        </h3>
      </motion.div>
    </Link>
  );
}
