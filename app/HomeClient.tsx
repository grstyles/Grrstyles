'use client';

import React, { useState, useEffect } from 'react';
import AutoScrollCarousel from '@/components/home/AutoScrollCarousel';
import ProductSection from '@/components/ui/ProductSection';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { config } from '@/lib/config';
import { matchCategory } from '@/lib/utils/categoryImageMap';

export default function HomeClient({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        setProducts(prods);
      });
    }
  }, []);

  // Filter products for each approved homepage section using matchCategory
  const trendingCollections = products.filter((p) => matchCategory(p, 'trending-collections')).slice(0, 4);
  const dealOfTheDay = products.filter((p) => matchCategory(p, 'deal-of-the-day')).slice(0, 4);
  const comboOffers = products.filter((p) => matchCategory(p, 'combo-offers')).slice(0, 4);
  const festivalOffers = products.filter((p) => matchCategory(p, 'festival-offers')).slice(0, 4);
  const weekendOffers = products.filter((p) => matchCategory(p, 'weekend-offers')).slice(0, 4);

  return (
    <>
      {/* Hero Banner */}
      <AutoScrollCarousel />

      {/* Trending Collections */}
      <ProductSection
        title="Trending Collections"
        subtitle="The hot curations and style outlines turning heads this season."
        products={trendingCollections}
        badge="HOT PICK"
        viewAllHref="/collections/trending-collections"
      />

      {/* Deal Of The Day */}
      <ProductSection
        title="Deal Of The Day"
        subtitle="Exclusive handpicked offers and time-limited deals."
        products={dealOfTheDay}
        badge="DEAL OF THE DAY"
        viewAllHref="/collections/deal-of-the-day"
      />

      {/* Combo Offers */}
      <ProductSection
        title="Combo Offers"
        subtitle="Coordinated outfit sets and bundled savings."
        products={comboOffers}
        badge="COMBO"
        viewAllHref="/collections/combo-offers"
      />

      {/* Festival Offers */}
      <ProductSection
        title="Festival Offers"
        subtitle="Celebrate in style with special festive season discounts."
        products={festivalOffers}
        badge="FESTIVAL DEALS"
        viewAllHref="/collections/festival-offers"
      />

      {/* Weekend Offers */}
      <ProductSection
        title="Weekend Offers"
        subtitle="Relaxed lightweight weekend items with premium deals."
        products={weekendOffers}
        badge="WEEKEND DEALS"
        viewAllHref="/collections/weekend-offers"
      />
    </>
  );
}

