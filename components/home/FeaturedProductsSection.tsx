'use client';

import React from 'react';
import ProductSection from '@/components/ui/ProductSection';
import { mockStore } from '@/lib/providers/mockStore';

export default function FeaturedProductsSection() {
  // Use first 8 products for demo
  const featured = mockStore.getProducts().slice(0, 8);

  return (
    <ProductSection
      title="Featured Picks"
      subtitle="Curated bestsellers just for you"
      products={featured}
      viewAllHref="/collections"
    />
  );
}
