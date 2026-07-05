'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';

// Register ScrollTrigger client-side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductSectionProps {
  title: string;
  subtitle: string;
  products: any[];
  badge?: string;
  viewAllHref?: string;
}

export default function ProductSection({
  title,
  subtitle,
  products,
  badge,
  viewAllHref,
}: ProductSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.section-product-card',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [products]);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-[#faf8f6] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            {badge && (
              <span className="inline-block px-3 py-1 bg-black text-white text-[9px] font-bold tracking-widest uppercase rounded-full mb-3 shadow-xs">
                {badge}
              </span>
            )}
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a] tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-[#6b5b4b] text-sm font-light">
              {subtitle}
            </p>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-[#1a1a1a] font-semibold text-xs uppercase tracking-widest hover:text-[#8b7b6b] transition-colors border-b-2 border-transparent hover:border-[#8b7b6b] pb-0.5"
            >
              View All →
            </Link>
          )}
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="section-product-card">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white border border-gray-100 rounded-3xl p-6">
            <p className="text-sm text-gray-500 font-light">No products listed in this section.</p>
          </div>
        )}
      </div>
    </section>
  );
}
