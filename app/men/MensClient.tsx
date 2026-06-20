'use client';

import React, { useState, useEffect } from 'react';
import MensHeroCarousel from '@/components/men/MensHeroCarousel';
import MensCategoryCarousel from '@/components/men/MensCategoryCarousel';
import SummerEssentialsBanner from '@/components/men/SummerEssentialsBanner';
import WhyChooseUs from '@/components/men/WhyChooseUs';
import StyleInspirationGallery from '@/components/men/StyleInspirationGallery';
import LuxuryNewsletter from '@/components/men/LuxuryNewsletter';

// Reusable components
import ProductSection from '@/components/ui/ProductSection';
import CollectionSection from '@/components/ui/CollectionSection';
import ComboSection from '@/components/ui/ComboSection';
import { Product } from '@/lib/data/products';
import { repo } from '@/lib/repositories';
import { config } from '@/lib/config';

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

  // Extract products
  const featuredProducts = products.slice(0, 8);
  const bestsellers = products.slice().reverse().slice(0, 4);

  const collections = [
    {
      title: 'Korean Collection',
      slug: 'korean-collection',
      image: '/images/collections/korean_collection.png',
      description: 'Clean tailoring and oversized denim inspired by modern Seoul style.',
      badge: 'TRENDING'
    },
    {
      title: 'Festival Collection',
      slug: 'festival-collection',
      image: '/images/collections/festival_collection.png',
      description: 'Vibrant colors and relaxed fits, perfect for celebratory weekends.',
      badge: 'SEASONAL'
    },
    {
      title: 'Formal Collection',
      slug: 'formal-collection',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800',
      description: 'Sharp tailoring and executive styling for the modern boardroom.',
      badge: 'PREMIUM'
    },
    {
      title: 'Weekend Collection',
      slug: 'weekend-collection',
      image: '/images/collections/weekend_collection.png',
      description: 'Smart casual resort shirts and lightweight linen chinos for off-duty ease.',
      badge: 'COMFORT'
    },
    {
      title: 'Denim Collection',
      slug: 'denim-collection',
      image: 'https://images.unsplash.com/photo-1542272604-787c62002397?q=80&w=800',
      description: 'Rugged vintage washes and oversized baggy jeans with premium fits.',
      badge: 'CLASSIC'
    },
    {
      title: 'Streetwear Collection',
      slug: 'streetwear-collection',
      image: 'https://images.unsplash.com/photo-1556821552-5ff63b1b5786?q=80&w=800',
      description: 'Heavyweight organic cotton hoodies and graphic tees with bold shapes.',
      badge: 'STREET STYLE'
    },
    {
      title: 'Premium Essentials',
      slug: 'premium-essentials',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800',
      description: 'High-density crew neck tees and basic polos for daily comfort.',
      badge: 'ESSENTIALS'
    },
    {
      title: 'Office Wear Collection',
      slug: 'office-wear-collection',
      image: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?q=80&w=800',
      description: 'Wrinkle-resistant trousers and crisp executive shirts for office hours.',
      badge: 'OFFICE READY'
    }
  ];

  const combos = [
    {
      id: 'look-1',
      title: 'Casual Weekend',
      description: 'Shirt + Jeans + Sneakers',
      originalPrice: 3846,
      discountedPrice: 2999,
      slug: 'casual-weekend',
      images: [
        'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=800',
        'https://images.unsplash.com/photo-1542272604-787c62002397?q=80&w=800',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800',
      ],
    },
    {
      id: 'look-2',
      title: 'Office Ready',
      description: 'Blazer + Trousers + Watch',
      originalPrice: 6796,
      discountedPrice: 5299,
      slug: 'office-ready',
      images: [
        'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800',
        'https://images.unsplash.com/photo-1473617231723-2a5ebf1379b7?w=800&q=80',
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80',
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-[#fcfbf9]">
      <MensHeroCarousel />
      <MensCategoryCarousel />
      <SummerEssentialsBanner />
      
      {/* Featured Products */}
      <ProductSection
        title="Featured Products"
        subtitle="Handpicked essentials for modern men."
        products={featuredProducts}
      />

      {/* Complete The Look */}
      <ComboSection
        title="Complete The Look"
        subtitle="Handpicked outfit bundles for the modern man."
        combos={combos}
      />

      {/* Trending Collections */}
      <CollectionSection
        title="Trending Collections"
        subtitle="Explore hot curations of premium apparel."
        collections={collections}
      />

      {/* Bestsellers */}
      <ProductSection
        title="Bestsellers"
        subtitle="Our most loved pieces this season."
        products={bestsellers}
        badge="#1 SELLING"
      />

      <WhyChooseUs />
      <StyleInspirationGallery />
      <LuxuryNewsletter />
    </main>
  );
}
