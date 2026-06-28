'use client';

import React, { useState, useEffect } from 'react';
import AutoScrollCarousel from '@/components/home/AutoScrollCarousel';
import ProductSection from '@/components/ui/ProductSection';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { Banner } from '@/lib/repositories/interfaces';
import { config } from '@/lib/config';
import { matchCategory } from '@/lib/utils/categoryImageMap';

export default function HomeClient({ initialProducts, initialBanners }: { initialProducts: Product[], initialBanners?: Banner[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [banners, setBanners] = useState<Banner[]>(initialBanners || []);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        setProducts(prods);
      });
      repo.banners.getActive().then(setBanners);
    }
  }, []);

  // Filter products for each approved homepage section
  const trendingCollections = products.filter((p) => p.bestSeller || p.metadata?.featured).slice(0, 4);
  const dealOfTheDay = products.filter((p) => p.metadata?.dealOfDay).slice(0, 4);
  const comboOffers = products.filter((p) => p.category === 'Combo Offer').slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

  // Dynamic Collections
  const dynamicCollections = Array.from(new Set(products.map(p => p.collection).filter(Boolean))) as string[];

  return (
    <>
      {/* Hero Banner */}
      <AutoScrollCarousel banners={banners} />

      {/* Deal Of The Day */}
      {dealOfTheDay.length > 0 && (
        <ProductSection
          title="Deal Of The Day"
          subtitle="Exclusive handpicked offers and time-limited deals."
          products={dealOfTheDay}
          badge="DEAL OF THE DAY"
          viewAllHref="/collections/deal-of-the-day"
        />
      )}

      {/* Trending Collections */}
      {trendingCollections.length > 0 && (
        <ProductSection
          title="Trending Collections"
          subtitle="The hot curations and style outlines turning heads this season."
          products={trendingCollections}
          badge="HOT PICK"
          viewAllHref="/collections/trending-collections"
        />
      )}

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh drops and latest additions to our catalog."
          products={newArrivals}
          badge="NEW"
          viewAllHref="/collections/new-arrivals"
        />
      )}

      {/* Combo Offers */}
      {comboOffers.length > 0 && (
        <ProductSection
          title="Combo Offers"
          subtitle="Coordinated outfit sets and bundled savings."
          products={comboOffers}
          badge="COMBO"
          viewAllHref="/category/Combo%20Offer"
        />
      )}

      {/* Dynamic Collections generated from product data */}
      {dynamicCollections.map((collectionName) => {
        const collectionProducts = products.filter(p => p.collection === collectionName).slice(0, 4);
        if (collectionProducts.length === 0) return null;
        
        // Generate a URL-friendly slug
        const slug = collectionName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        
        return (
          <ProductSection
            key={collectionName}
            title={collectionName}
            subtitle={`Explore our exclusive ${collectionName} curations.`}
            products={collectionProducts}
            badge="COLLECTION"
            viewAllHref={`/collections/${slug}`}
          />
        );
      })}
    </>
  );
}

