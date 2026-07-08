"use client";

import React, { MouseEvent as ReactMouseEvent } from "react";
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
  { id: '7', title: 'Festival Wear', slug: 'festival-wear', image_url: '/images/categories/festival_wear.png', bg_color: '#F9F7F5', priority: 6, featured: false, enabled: true },
];

export default function PremiumCategoryCarousel({
  categories,
  title = "Shop by Category",
  subtitle = "Discover premium essentials crafted for modern men."
}: PremiumCategoryCarouselProps) {
  const displayCategories = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;

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
        {/* Mobile: Vertical grid, Desktop: Horizontal scroll */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:gap-8 justify-items-center md:flex md:flex-nowrap md:overflow-x-auto md:gap-8 md:pb-4 md:px-2 scrollbar-hide">
          {displayCategories.map((category) => (
            <CarouselItem 
              key={category.id}
              category={category}
            />
          ))}
        </div>
      </div>
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
      className="block w-full max-w-[180px] md:min-w-[140px] lg:min-w-[160px] select-none outline-none group focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-4 rounded-full transition-all duration-300 hover:-translate-y-2 hover:scale-105" 
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
