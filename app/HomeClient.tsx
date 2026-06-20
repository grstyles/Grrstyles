'use client';

import React, { useState, useEffect } from 'react';
import AutoScrollCarousel from '@/components/home/AutoScrollCarousel';
import ProductSection from '@/components/ui/ProductSection';
import HomeComboSection from '@/components/home/ComboSection';
import Newsletter from '@/components/home/Newsletter';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { config } from '@/lib/config';

export default function HomeClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        setProducts(prods);
      });
    }
  }, []);

  // Filter products for each section
  const koreanCollection = products
    .filter((p) => (p.name || p.title || '').toLowerCase().includes('korean') || (p.description || '').toLowerCase().includes('korean'))
    .slice(0, 4);

  const trendingCollection = products
    .filter((p) => p.bestSeller || p.metadata?.featured || (p as any).isFeatured || p.label === 'HOT')
    .slice(0, 4);

  const newArrivals = products
    .filter((p) => p.isNew || (p as any).newArrival || p.label === 'NEW')
    .slice(0, 4);

  const baggyPantsCollection = products
    .filter((p) => (p.name || p.title || '').toLowerCase().includes('baggy'))
    .slice(0, 4);

  const formalWearCollection = products
    .filter((p) => (p.name || p.title || '').toLowerCase().includes('formal') || (p.name || p.title || '').toLowerCase().includes('office'))
    .slice(0, 4);

  const festivalCollection = products
    .filter((p) => p.label === 'HOT' || (p.discountPercent || 0) > 20 || (p.name || p.title || '').toLowerCase().includes('festival'))
    .slice(0, 4);

  const weekendCollection = products
    .filter((p) => (p.name || p.title || '').toLowerCase().includes('weekend') || (p.name || p.title || '').toLowerCase().includes('casual'))
    .slice(0, 4);

  const bestSellers = products
    .filter((p) => p.bestSeller || (p.rating && p.rating >= 4.6))
    .slice(0, 4);

  return (
    <>
      {/* 1. Hero Banner */}
      <AutoScrollCarousel />

      {/* 2. Korean Collection */}
      <ProductSection
        title="Korean Collection"
        subtitle="Minimalist, oversized silhouettes inspired by modern Seoul street fashion."
        products={koreanCollection}
        badge="TRENDING STYLE"
        viewAllHref="/collections/korean-collection"
      />

      {/* 3. Trending Collection */}
      <ProductSection
        title="Trending Collection"
        subtitle="The hot curations and style outlines turning heads this season."
        products={trendingCollection}
        badge="HOT PICK"
      />

      {/* 4. New Arrivals */}
      <ProductSection
        title="New Arrivals"
        subtitle="Fresh drops, premium fabrics, and state-of-the-art designs."
        products={newArrivals}
        badge="JUST LAUNCHED"
        viewAllHref="/new-in"
      />

      {/* 5. Baggy Pants Collection */}
      <ProductSection
        title="Baggy Pants Collection"
        subtitle="Comfortable loose-fit shapes, brushed twill textures, and drop silhouettes."
        products={baggyPantsCollection}
        badge="LOOSE FIT"
      />

      {/* 6. Formal Wear Collection */}
      <ProductSection
        title="Formal Wear Collection"
        subtitle="Tailored office shirts, anti-wrinkle flat trousers, and smart executive styles."
        products={formalWearCollection}
        badge="OFFICE ESSENTIALS"
        viewAllHref="/collections/formal-collection"
      />

      {/* 7. Festival Collection */}
      <ProductSection
        title="Festival Collection"
        subtitle="Vibrant, rich textures and celebratory fits designed for weddings and weekends."
        products={festivalCollection}
        badge="CELEBRATION READY"
        viewAllHref="/collections/festival-collection"
      />

      {/* 8. Weekend Collection */}
      <ProductSection
        title="Weekend Collection"
        subtitle="Relaxed lightweight resort shirts and casual linen chinos for off-duty days."
        products={weekendCollection}
        badge="EASY CASUAL"
        viewAllHref="/collections/weekend-collection"
      />

      {/* 9. Combo Offers */}
      <HomeComboSection />

      {/* 10. Best Sellers */}
      <ProductSection
        title="Best Sellers"
        subtitle="Our most loved, heritage pieces with verified customer ratings."
        products={bestSellers}
        badge="CUSTOMER FAVORITE"
      />

      {/* 11. Newsletter */}
      <Newsletter />
    </>
  );
}
