"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoryImage, normalizeSlug } from "@/lib/utils/categoryImageMap";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";

export interface PremiumCategoryCarouselProps {
  categories: string[];
  title?: string;
  subtitle?: string;
}

export default function PremiumCategoryCarousel({
  categories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men."
}: PremiumCategoryCarouselProps) {
  const scrollRef = useDraggableScroll<HTMLDivElement>();

  return (
    <section className="py-16 md:py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-light text-[#1a1a1a] mb-4 tracking-wide">
          {title}
        </h2>
        <p className="text-sm md:text-base text-[#6b5b4b]">
          {subtitle}
        </p>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8">
        <div 
          ref={scrollRef}
          className="flex items-center gap-6 md:gap-10 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
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
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CarouselItem({ category, slug, img }: {
  category: string;
  slug: string;
  img: string;
}) {
  return (
    <Link href={`/category/${slug}`} className="block shrink-0 snap-start select-none" draggable={false}>
      <div className="flex flex-col items-center justify-center gap-4 group">
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-full overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.08)] group-hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-shadow duration-300 bg-[#f5f0eb] border border-gray-100">
          <Image
            src={img}
            alt={category}
            fill
            sizes="(max-width: 640px) 112px, (max-width: 1024px) 144px, 176px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            draggable={false}
          />
        </div>
        <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-800 uppercase tracking-widest text-center transition-colors group-hover:text-black">
          {category}
        </h3>
      </div>
    </Link>
  );
}
