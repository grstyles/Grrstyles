'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface CollectionCard {
  title: string;
  slug: string;
  image: string;
  description: string;
  badge?: string;
}

interface CollectionSectionProps {
  title: string;
  subtitle: string;
  collections: CollectionCard[];
}

export default function CollectionSection({ title, subtitle, collections }: CollectionSectionProps) {
  return (
    <section className="py-16 md:py-20 bg-[#faf8f6] border-b border-gray-100">
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

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {collections.map((col, idx) => (
            <motion.div
              key={col.slug}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100/50 flex flex-col h-full"
            >
              {/* Image box */}
              <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all duration-300" />
                {col.badge && (
                  <span className="absolute top-4 left-4 bg-black text-white text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-full shadow-xs uppercase">
                    {col.badge}
                  </span>
                )}
              </div>

              {/* Details box */}
              <div className="p-6 flex flex-col justify-between flex-grow">
                <div>
                  <h3 className="text-lg font-bold text-[#1a1a1a] uppercase mb-2 group-hover:text-[#8b7b6b] transition-colors">
                    {col.title}
                  </h3>
                  <p className="text-xs text-[#6b5b4b] leading-relaxed mb-6 font-light">
                    {col.description}
                  </p>
                </div>

                <Link
                  href={`/collections/${col.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a1a1a] hover:text-[#8b7b6b] uppercase tracking-widest border-b border-transparent hover:border-[#8b7b6b] w-fit transition-colors pb-0.5"
                >
                  Explore <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
