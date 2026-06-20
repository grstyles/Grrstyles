'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils/helpers';
import { ShoppingBag } from 'lucide-react';

export interface ComboItem {
  id: string | number;
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  images: string[];
  slug: string;
}

interface ComboSectionProps {
  title?: string;
  subtitle?: string;
  combos: ComboItem[];
}

export default function ComboSection({
  title = 'COMPLETE THE LOOK',
  subtitle = 'Curated bundles at an exclusive discount.',
  combos,
}: ComboSectionProps) {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#1a1a1a] tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-[#6b5b4b] text-sm font-light">
            {subtitle}
          </p>
        </div>

        {/* Combo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => {
            const savingsPercent = Math.round(
              ((combo.originalPrice - combo.discountedPrice) / combo.originalPrice) * 100
            );

            return (
              <div key={combo.id} className="group flex flex-col justify-between h-full bg-[#faf8f6] p-6 sm:p-8 rounded-3xl border border-gray-100/50">
                <div>
                  {/* Images Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 overflow-hidden rounded-2xl">
                    {combo.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square overflow-hidden bg-white">
                        <Image
                          src={img}
                          alt={`${combo.title} item ${idx + 1}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 30vw, 15vw"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Content Details */}
                  <h3 className="text-lg font-bold text-gray-900 uppercase mb-2 tracking-wide">
                    {combo.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-light leading-relaxed mb-4">
                    {combo.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100/80 flex items-center justify-between flex-wrap gap-4 mt-6">
                  {/* Prices */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(combo.originalPrice)}
                    </span>
                    <span className="font-bold text-lg text-gray-900">
                      {formatPrice(combo.discountedPrice)}
                    </span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      SAVE {savingsPercent}%
                    </span>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/combo/${combo.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <ShoppingBag size={12} />
                    Shop Bundle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
