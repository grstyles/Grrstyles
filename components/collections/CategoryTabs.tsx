"use client";
import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useDraggableScroll } from "@/hooks/useDraggableScroll";

interface CategoryTabsProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
}

const categories = [
  "All",
  "New Arrivals",
  "Shirts",
  "T-Shirts",
  "Polo Shirts",
  "Jeans",
  "Trousers",
  "Blazers",
  "Jackets",
  "Footwear",
  "Accessories",
];

export default function CategoryTabs({
  activeCategory,
  setActiveCategory,
}: CategoryTabsProps) {
  const scrollContainerRef = useDraggableScroll<HTMLDivElement>();
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeTab = activeTabRef.current;
      
      const containerWidth = container.offsetWidth;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const scrollPosition = tabLeft - (containerWidth / 2) + (tabWidth / 2);
      
      gsap.to(container, {
        scrollLeft: scrollPosition,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-0 z-20 bg-white/92 backdrop-blur-sm border-b border-gray-100">
      <div 
        ref={scrollContainerRef}
        className="max-w-[1600px] mx-auto px-4 md:px-8 py-3 flex items-center gap-1 overflow-x-auto scrollbar-none scroll-smooth"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              ref={isActive ? activeTabRef : null}
              className={`relative px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? 'bg-black text-white shadow-md' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-100'
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#D4AF37] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}