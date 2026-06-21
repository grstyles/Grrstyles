"use client";

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/repositories';
import { config } from '@/lib/config';
import SaleHeroBanner from '@/components/sale/SaleHeroBanner';
import SaleCategoryTabs from '@/components/sale/SaleCategoryTabs';
import DealOfTheDay from '@/components/sale/DealOfTheDay';
import SaleProductGrid from '@/components/sale/SaleProductGrid';
import ShopByDiscount from '@/components/sale/ShopByDiscount';
import SaleCompleteTheLook from '@/components/sale/SaleCompleteTheLook';
import FlashSaleBanner from '@/components/sale/FlashSaleBanner';
import BestSellersOnSale from '@/components/sale/BestSellersOnSale';
import WhyChooseUs from '@/components/men/WhyChooseUs';
import type { Product } from '@/lib/data/products';

interface SaleClientProps {
  initialProducts: Product[];
}

const categoryMapping: Record<string, string> = {
  'Shirts': 'Shirts',
  'T-Shirts': 'T-Shirts',
  'Jeans': 'Jeans',
  'Trousers': 'Trousers',
  'Blazers': 'Jackets',
  'Jackets': 'Jackets',
  'Footwear': 'Shoes',
  'Accessories': 'Accessories'
};

export default function SaleClient({ initialProducts }: SaleClientProps) {
  const [activeCategory, setActiveCategory] = useState("All Sale");
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        setAllProducts(prods);
      });
    }
  }, []);

  // Filter sale products (all products in our database have discountPercent > 0)
  const allSaleProducts = allProducts.filter(p => (p.discountPercent || 0) > 0);

  // Filter based on active tab category
  const filteredProducts = allSaleProducts.filter(p => {
    if (activeCategory === "All Sale") return true;
    const dbCatName = categoryMapping[activeCategory];
    return p.category === dbCatName;
  });

  return (
    <main className="min-h-screen bg-[#fcfbf9] pb-12">
      <SaleHeroBanner />

      {/* Category Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8">
        <div className="flex flex-col items-center">
          <SaleCategoryTabs active={activeCategory} setActive={setActiveCategory} />

          {/* Active Category Indicator & Product Count */}
          <div className="mt-6 text-center animate-fadeIn">
            <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase block mb-1">
              {activeCategory} Collection
            </span>
            <h2 className="text-xl md:text-2xl font-light text-gray-800">
              Showing <span className="font-bold">{filteredProducts.length}</span> Sale Products
            </h2>
          </div>
        </div>
      </div>

      {/* Deal of the Day Section (Category-filtered and auto-rotating) */}
      <div className="mt-8">
        <DealOfTheDay categoryProducts={filteredProducts} activeCategoryName={activeCategory} />
      </div>

      {/* Dynamic Product Grid */}
      <div className="mt-8">
        <SaleProductGrid
          products={filteredProducts}
          title={`${activeCategory === 'All Sale' ? 'Best Sale Picks' : activeCategory + ' Deals'}`}
          badge="UP TO 70% OFF"
          filterDiscount={20}
        />
      </div>

      <ShopByDiscount />
      
      {/* Customer Favorites sale grid */}
      <div className="mt-4">
        <SaleProductGrid
          products={filteredProducts}
          title="Customer Favorites"
          badge="#1 SELLING"
          filterDiscount={30}
          limit={4}
        />
      </div>

      <SaleCompleteTheLook />
      <FlashSaleBanner />
      <BestSellersOnSale />
      <WhyChooseUs />
    </main>
  );
}
