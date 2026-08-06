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
  const koreanCollection = products.filter((p) => matchCategory(p, 'korean-collections')).slice(0, 4);
  const shoesCollection = products.filter((p) => matchCategory(p, 'shoes')).slice(0, 4);
  const instaViralCollection = products.filter((p) => matchCategory(p, 'insta-viral-collections')).slice(0, 4);
  const traditionalCollection = products.filter((p) => matchCategory(p, 'traditional-collections')).slice(0, 4);

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

      {/* 5. Insta Viral Collection */}
      <ProductSection
        title="Insta Viral Collection"
        subtitle="Trending styles and viral outfits taking social media by storm."
        products={instaViralCollection}
        badge="VIRAL"
        viewAllHref="/collections/insta-viral-collections"
      />

      {/* 6. Combo Offers */}
      <ProductSection
        title="Combo Offers"
        subtitle="Coordinated outfit sets and bundled savings."
        products={comboOffers}
        badge="COMBO"
        viewAllHref="/collections/combo-offers"
      />
      <ProductSection
        title="Korean Collection"
        subtitle="Sleek Korean fits, oversized silhouettes, and modern streetwear."
        products={koreanCollection}
        badge="Korean"
        viewAllHref="/collections/korean-collections"
      />
      <ProductSection
        title="Shoes Collection"
        subtitle="Premium footwear and sneakers crafted for modern comfort."
        products={shoesCollection}
        badge="Shoes"
        viewAllHref="/collections/shoes"
      />
      <ProductSection
        title="Traditional Collection"
        subtitle="Heritage wear, ethnic styles, and classic celebratory outfits."
        products={traditionalCollection}
        badge="Traditional"
        viewAllHref="/collections/traditional-collections"
      />

    </main>
  );
}

