"use client";

import React, { useState, useEffect } from 'react';
import { repo } from '@/lib/repositories';
import { Product } from '@/lib/data/products';
import CollectionHeader from '@/components/collections/CollectionHeader';
import CategoryTabs from '@/components/collections/CategoryTabs';
import FilterSidebar, { FilterState } from '@/components/collections/FilterSidebar';
import CollectionGrid from '@/components/collections/CollectionGrid';
import { matchCategory as globalMatchCategory } from '@/lib/utils/categoryImageMap';

export default function CollectionsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    subCategories: [],
    sizes: [],
    colors: [],
    brands: [],
    priceRange: [0, 10000],
    discount: 0,
    rating: 0,
    availability: [],
    occasion: [],
    fabric: [],
    pattern: [],
    sleeveLength: [],
    neckStyle: [],
    inStock: false,
    onSale: false,
    newArrivals: false,
    featured: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await repo.products.getAll();
        setProducts(data);
      } catch (err) {
        console.error('Failed to load products in collections', err);
      }
    }
    load();
  }, []);

  const matchCategory = (catId: string, p: Product) => {
    if (catId === 'all') return true;
    return globalMatchCategory(p, catId);
  };

  // Filter products based on category and sidebar filters
  const getFilteredProducts = () => {
    let items = products;
    
    if (activeCategory === 'New Arrivals') {
      items = items.filter(p => p.isNew === true || (p as any).newArrival || p.label === 'NEW');
    } else if (activeCategory !== 'All') {
      items = items.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());
    }

    if (filters.categories.length > 0) {
      items = items.filter((p) =>
        filters.categories.some((catId) => matchCategory(catId, p))
      );
    }

    items = items.filter(p => {
      const price = p.discountedPrice ?? p.sellingPrice ?? p.price ?? 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    if (filters.sizes.length > 0) {
      items = items.filter(p => p.sizes?.some(s => filters.sizes.includes(s.size) && s.stock > 0));
    }

    if (filters.colors.length > 0) {
      items = items.filter(p => 
        filters.colors.includes(p.color) || 
        p.colors?.some(c => filters.colors.includes(c))
      );
    }

    if (filters.brands?.length > 0) {
      items = items.filter(p => 
        filters.brands.some(b => (p.brand || '').toLowerCase().includes(b.toLowerCase()))
      );
    }

    if (filters.inStock) {
      items = items.filter(p => 
        p.inStock || 
        (p.stockCount && p.stockCount > 0) || 
        p.sizes?.some(s => s.stock > 0)
      );
    }

    if (filters.onSale) {
      items = items.filter(p => 
        p.discountPercent > 0 || 
        (p.discountedPrice && p.discountedPrice < p.price)
      );
    }

    if (filters.newArrivals) {
      items = items.filter(p => p.isNew || (p as any).newArrival || p.label === 'NEW');
    }

    if (filters.featured) {
      items = items.filter(p => p.bestSeller || p.metadata?.featured || (p as any).featured || (p as any).isFeatured);
    }

    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      items = items.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    return items;
  };

  const getSortedProducts = (items: Product[]) => {
    return [...items].sort((a, b) => {
      const aPrice = a.discountedPrice ?? a.sellingPrice ?? a.price ?? 0;
      const bPrice = b.discountedPrice ?? b.sellingPrice ?? b.price ?? 0;

      switch (filters.sortOption) {
        case 'price-low':
          return aPrice - bPrice;
        case 'price-high':
          return bPrice - aPrice;
        case 'discount':
          return (b.discountPercent || 0) - (a.discountPercent || 0);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
        default:
          const aTime = a.isNew || (a as any).newArrival ? 1 : 0;
          const bTime = b.isNew || (b as any).newArrival ? 1 : 0;
          return bTime - aTime;
      }
    });
  };

  const displayProducts = getSortedProducts(getFilteredProducts());

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <main className="min-h-screen bg-[#fcfbf9]">
      {/* Page Header */}
      <CollectionHeader />
      
      {/* Category Tabs */}
      <CategoryTabs 
        activeCategory={activeCategory} 
        setActiveCategory={handleCategoryChange} 
      />
      
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
            Filters
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
              {displayProducts.length}
            </span>
          </button>
          
          <p className="text-sm text-gray-500">
            {displayProducts.length} products
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left Side: Filter Sidebar */}
          <div className={`
            w-full lg:w-[280px] xl:w-[320px] flex-shrink-0
            transition-all duration-300
            ${isFilterOpen ? 'block' : 'hidden lg:block'}
          `}>
            <FilterSidebar 
              isOpen={isFilterOpen}
              onFilterChange={setFilters}
              totalProducts={displayProducts.length}
            />
          </div>
          
          {/* Right Side: Main Content */}
          <div className="flex-1 min-w-0">
            <CollectionGrid products={displayProducts} />
          </div>
        </div>
      </div>
    </main>
  );
}