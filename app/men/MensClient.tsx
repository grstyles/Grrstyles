'use client';

import React, { useState, useEffect } from 'react';
import MensHeroCarousel from '@/components/men/MensHeroCarousel';
import MensCategoryCarousel from '@/components/men/MensCategoryCarousel';
import ProductSection from '@/components/ui/ProductSection';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { config } from '@/lib/config';
import { matchCategory } from '@/lib/utils/categoryImageMap';

interface MensClientProps {
  initialProducts: Product[];
}

export default function MensClient({ initialProducts }: MensClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        setProducts(prods);
      });
    }
  }, []);

  const trendingCollections = products.filter((p) => matchCategory(p, 'trending-collections')).slice(0, 4);
  const dealOfTheDay = products.filter((p) => matchCategory(p, 'deal-of-the-day')).slice(0, 4);
  const comboOffers = products.filter((p) => matchCategory(p, 'combo-offers')).slice(0, 4);

  return (
    <main className="min-h-screen bg-[#fcfbf9] animate-fadeIn pb-12">
      {/* 1. Mens Hero Banner */}
      <MensHeroCarousel />

      {/* 2. Shop By Category */}
      <MensCategoryCarousel />

      {/* 3. Trending Collections */}
      <ProductSection
        title="Trending Collections"
        subtitle="The hot curations and style outlines turning heads this season."
        products={trendingCollections}
        badge="HOT PICK"
        viewAllHref="/collections/trending-collections"
      />

      {/* 4. Deal Of The Day */}
      <ProductSection
        title="Deal Of The Day"
        subtitle="Exclusive handpicked offers and time-limited deals."
        products={dealOfTheDay}
        badge="DEAL OF THE DAY"
        viewAllHref="/collections/deal-of-the-day"
      />

      {/* 5. Combo Offers */}
      <ProductSection
        title="Combo Offers"
        subtitle="Coordinated outfit sets and bundled savings."
        products={comboOffers}
        badge="COMBO"
        viewAllHref="/collections/combo-offers"
      />
    </main>
  );
}

