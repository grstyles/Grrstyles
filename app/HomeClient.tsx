'use client';

import React, { useState, useEffect } from 'react';
import AutoScrollCarousel from '@/components/home/AutoScrollCarousel';
import ProductSection from '@/components/ui/ProductSection';
import PremiumCategoryCarousel from '@/components/ui/PremiumCategoryCarousel';
import ClearanceBanner from '@/components/sale/ClearanceBanner';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { Banner } from '@/lib/repositories/interfaces';
import { CategoryCarouselItem } from '@/lib/repositories/categoryCarouselRepository';
import { config } from '@/lib/config';

// Default ordering of homepage sections
const DEFAULT_SECTIONS = [
  { id: 'hero', name: 'Hero Banner', enabled: true },
  { id: 'categories', name: 'Category Circles', enabled: true },
  { id: 'mens', name: 'Men Collection', enabled: true },
  { id: 'trending', name: 'Trending Collection', enabled: true },
  { id: 'clearance', name: 'Clearance Sale', enabled: true },
  { id: 'new', name: 'New Arrivals', enabled: true },
];

export default function HomeClient({ initialProducts, initialBanners }: { initialProducts: Product[], initialBanners?: Banner[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [banners, setBanners] = useState<Banner[]>(initialBanners || []);
  const [carouselCategories, setCarouselCategories] = useState<CategoryCarouselItem[]>([]);
  const [sectionOrder, setSectionOrder] = useState(DEFAULT_SECTIONS);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then(setProducts);
      repo.banners.getActive().then(setBanners);
    }
    repo.categoryCarousel.getActive().then(setCarouselCategories);
    
    // Simulate fetching dynamic marketing config for homepage order
    const savedOrder = localStorage.getItem('gr_homepage_order');
    if (savedOrder) {
      try {
        setSectionOrder(JSON.parse(savedOrder));
      } catch (e) {}
    }
    
    // Listen for storage events to update instantly across tabs (Admin -> Frontend)
    const handleStorage = () => {
      const updated = localStorage.getItem('gr_homepage_order');
      if (updated) setSectionOrder(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const trendingCollections = products.filter((p) => p.bestSeller || p.metadata?.featured).slice(0, 4);
  const mensCollection = products.filter((p) => 
    ['Shirts', 'Printed Shirts', 'T-Shirts', 'Formal Pant', 'Trousers', 'Jackets'].includes(p.category)
  ).slice(0, 4);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 4);

  const homeBanners = banners.filter(b => !b.target_page || b.target_page === 'home');
  const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const renderSection = (id: string) => {
    switch (id) {
      case 'hero':
        return <AutoScrollCarousel key="hero" banners={homeBanners} />;
      case 'categories':
        return <PremiumCategoryCarousel key="categories" categories={carouselCategories} />;
      case 'mens':
        return mensCollection.length > 0 ? (
          <ProductSection
            key="mens"
            title="Men's Collection"
            subtitle="The ultimate premium wardrobe for the modern gentleman."
            products={mensCollection}
            badge="MENS"
            viewAllHref="/men"
          />
        ) : null;
      case 'trending':
        return trendingCollections.length > 0 ? (
          <ProductSection
            key="trending"
            title="Trending Collections"
            subtitle="The hot curations and style outlines turning heads this season."
            products={trendingCollections}
            badge="HOT PICK"
            viewAllHref="/collections/trending-collections"
          />
        ) : null;
      case 'new':
        return newArrivals.length > 0 ? (
          <ProductSection
            key="new"
            title="New Arrivals"
            subtitle="Fresh drops and latest additions to our catalog."
            products={newArrivals}
            badge="NEW"
            viewAllHref="/collections/new-arrivals"
          />
        ) : null;
      case 'clearance':
        return <ClearanceBanner key="clearance" />;
      default:
        return null;
    }
  };

  return (
    <>
      {sectionOrder.filter(s => s.enabled).map(s => renderSection(s.id))}
    </>
  );
}
