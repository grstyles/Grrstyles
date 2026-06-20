"use client";

import { useState, useCallback, useEffect } from "react";
import FilterSidebar, { FilterState } from "@/components/collections/FilterSidebar";
import CollectionGrid from "@/components/collections/CollectionGrid";
import type { Product } from "@/lib/data/products";
import { repo } from "@/lib/repositories";
import { config } from "@/lib/config";

interface NewInClientProps {
  initialProducts: Product[];
}

export default function NewInClient({ initialProducts }: NewInClientProps) {
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filters, setFilters] = useState<FilterState>({} as FilterState);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (config.demoMode) {
      repo.products.getAll().then((prods) => {
        const newInProds = prods.filter((p) => p.isNew || (p as any).newArrival || p.label === 'NEW');
        setAllProducts(newInProds);
        setProducts(newInProds);
      });
    }
  }, []);

  const matchCategory = (catId: string, prodCat: string) => {
    const cat = catId.toLowerCase();
    const prod = prodCat.toLowerCase();
    if (cat === 'all') return true;

    if (prod.includes(cat) || cat.includes(prod)) return true;

    const cleanCat = cat.replace(/s$/, '');
    const cleanProd = prod.replace(/s$/, '');
    if (cleanProd.includes(cleanCat) || cleanCat.includes(cleanProd)) return true;

    const sidebarCats: Record<string, string[]> = {
      shirts: ['shirt'],
      tshirts: ['t-shirt', 'tshirt'],
      jeans: ['jean', 'denim'],
      trousers: ['trouser', 'pant', 'chino', 'cargo'],
      jackets: ['jacket', 'blazer', 'coat'],
      hoodies: ['hoodie', 'sweat', 'sweater'],
      shoes: ['shoe', 'sneaker', 'loafer', 'boot', 'footwear'],
      accessories: ['accessory', 'belt', 'wallet', 'watch', 'sunglass', 'bag', 'beanie'],
    };

    const keywords = sidebarCats[catId];
    if (keywords) {
      return keywords.some(kw => prod.includes(kw));
    }

    return false;
  };

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    let filtered = allProducts;
    
    if (newFilters.categories?.length > 0) {
      filtered = filtered.filter((p) =>
        newFilters.categories.some((catId) => matchCategory(catId, p.category || ''))
      );
    }

    filtered = filtered.filter(p => {
      const price = p.discountedPrice ?? p.sellingPrice ?? p.price ?? 0;
      return price >= (newFilters.priceRange?.[0] ?? 0) && price <= (newFilters.priceRange?.[1] ?? 10000);
    });

    if (newFilters.sizes?.length > 0) {
      filtered = filtered.filter(p => p.sizes?.some(s => newFilters.sizes.includes(s.size) && s.stock > 0));
    }

    if (newFilters.colors?.length > 0) {
      filtered = filtered.filter(p => 
        newFilters.colors.includes(p.color) || 
        p.colors?.some(c => newFilters.colors.includes(c))
      );
    }

    if (newFilters.brands?.length > 0) {
      filtered = filtered.filter(p => 
        newFilters.brands.some(b => (p.brand || '').toLowerCase().includes(b.toLowerCase()))
      );
    }

    if (newFilters.inStock) {
      filtered = filtered.filter(p => 
        p.inStock || 
        (p.stockCount && p.stockCount > 0) || 
        p.sizes?.some(s => s.stock > 0)
      );
    }

    if (newFilters.onSale) {
      filtered = filtered.filter(p => 
        p.discountPercent > 0 || 
        (p.discountedPrice && p.discountedPrice < p.price)
      );
    }

    if (newFilters.featured) {
      filtered = filtered.filter(p => p.bestSeller || p.metadata?.featured || (p as any).featured || (p as any).isFeatured);
    }

    if (newFilters.searchTerm) {
      const q = newFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      );
    }

    const sort = newFilters.sortOption || 'newest';
    const sorted = [...filtered].sort((a, b) => {
      const aPrice = a.discountedPrice ?? a.sellingPrice ?? a.price ?? 0;
      const bPrice = b.discountedPrice ?? b.sellingPrice ?? b.price ?? 0;

      switch (sort) {
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

    setProducts(sorted);
  }, [initialProducts]);

  const handleApply = () => {
    setSidebarOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#faf9f6] flex flex-col md:flex-row">
      {/* Mobile overlay sidebar */}
      <div className="md:hidden">
        {isSidebarOpen && (
          <FilterSidebar
            isOpen={true}
            onFilterChange={handleFilterChange}
            onApply={handleApply}
          />
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex w-80 border-r border-gray-200">
        <FilterSidebar
          isOpen={true}
          onFilterChange={handleFilterChange}
          onApply={handleApply}
        />
      </div>

      {/* Product grid */}
      <section className="flex-1 p-4">
        <CollectionGrid products={products} />
      </section>
    </main>
  );
}
