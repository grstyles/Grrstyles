'use client';

import Link from 'next/link';
import { Product } from '@/lib/data/products';
import ProductCard from './ProductCard';
import { useState } from 'react';
import FilterSidebar, { FilterState } from './FilterSidebar';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { Filter } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleFilterSidebar } from '@/lib/redux/slices/uiSlice';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  const dispatch = useDispatch();
  const filterSidebarOpen = useSelector((state: RootState) => state.ui.filterSidebarOpen);
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
  const [sortBy, setSortBy] = useState('new-arrivals');

  const matchCategory = (catId: string, prodCat: string) => {
    const cat = catId.toLowerCase();
    const prod = prodCat.toLowerCase();
    if (cat === 'all') return true;

    // Direct or substring match
    if (prod.includes(cat) || cat.includes(prod)) return true;

    // Plural/singular cleanups
    const cleanCat = cat.replace(/s$/, '');
    const cleanProd = prod.replace(/s$/, '');
    if (cleanProd.includes(cleanCat) || cleanCat.includes(cleanProd)) return true;

    // Keyword map
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

  const filteredProducts = products.filter((product) => {
    // 1. Category filter
    if (filters.categories.length > 0) {
      const prodCat = product.category || '';
      const matchesAnyCategory = filters.categories.some((catId) =>
        matchCategory(catId, prodCat)
      );
      if (!matchesAnyCategory) return false;
    }

    // 2. Price filter
    const productPrice = product.discountedPrice ?? (product as any).sellingPrice ?? product.price;
    if (productPrice < filters.priceRange[0] || productPrice > filters.priceRange[1]) {
      return false;
    }

    // 3. Brand filter
    if (filters.brands.length > 0) {
      const prodBrand = product.brand || '';
      const matchesAnyBrand = filters.brands.some(b => 
        prodBrand.toLowerCase().includes(b.toLowerCase()) || 
        b.toLowerCase().includes(prodBrand.toLowerCase())
      );
      if (!matchesAnyBrand) return false;
    }

    // 4. Size filter
    if (filters.sizes.length > 0) {
      const hasSize = product.sizes?.some((s: any) => 
        filters.sizes.includes(s.size) && s.stock > 0
      );
      if (!hasSize) return false;
    }

    // 5. Color filter
    if (filters.colors.length > 0) {
      const hasColor = 
        product.colors?.some((c: string) => filters.colors.includes(c)) || 
        filters.colors.includes(product.color);
      if (!hasColor) return false;
    }

    // 6. In Stock filter
    if (filters.inStock) {
      const hasStock = 
        product.inStock || 
        (product.stockCount && product.stockCount > 0) || 
        product.sizes?.some((s: any) => s.stock > 0);
      if (!hasStock) return false;
    }

    // 7. On Sale filter
    if (filters.onSale) {
      const hasSale = 
        (product as any).onSale || 
        (product.discountPercent && product.discountPercent > 0) || 
        ((product.discountedPrice ?? (product as any).sellingPrice) < product.price);
      if (!hasSale) return false;
    }

    // 8. New Arrivals filter
    if (filters.newArrivals) {
      const isNew = product.isNew || (product as any).newArrival;
      if (!isNew) return false;
    }

    // 9. Featured filter
    if (filters.featured) {
      const isFeatured = product.bestSeller || product.metadata?.featured || (product as any).isFeatured;
      if (!isFeatured) return false;
    }

    // 10. Search filter
    if (filters.searchTerm) {
      const q = filters.searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aPrice = a.discountedPrice ?? (a as any).sellingPrice ?? a.price;
    const bPrice = b.discountedPrice ?? (b as any).sellingPrice ?? b.price;

    const activeSort = filters.sortOption || sortBy;

    switch (activeSort) {
      case 'price-low':
        return aPrice - bPrice;
      case 'price-high':
        return bPrice - aPrice;
      case 'discount':
        return (b.discountPercent || 0) - (a.discountPercent || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'new-arrivals':
      case 'newest':
      case 'popular':
      default:
        const aNew = a.isNew || (a as any).newArrival ? 1 : 0;
        const bNew = b.isNew || (b as any).newArrival ? 1 : 0;
        if (aNew !== bNew) return bNew - aNew;
        return 0;
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-3xl md:text-4xl font-bold">Collection</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(toggleFilterSidebar())}
              className="md:hidden flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold"
            >
              <Filter size={18} />
              Filters
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border-2 border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-black"
            >
              <option value="new-arrivals">Sort by: New Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.categories.length > 0 || filters.brands.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.categories.map((cat) => (
              <span key={cat} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {cat}
              </span>
            ))}
            {filters.brands.map((brand) => (
              <span key={brand} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                {brand}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Sidebar */}
        <FilterSidebar onFilterChange={setFilters} isOpen={filterSidebarOpen} totalProducts={sortedProducts.length} />

        {/* Product Grid */}
        <div className="flex-1">
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600 mb-4">No products found</p>
              <button
                onClick={() =>
                  setFilters({
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
                  })
                }
                className="bg-black text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* Load More Button */}
          {sortedProducts.length > 6 && (
            <div className="flex justify-center mt-12">
              <button className="border-2 border-black text-black px-8 py-3 rounded-lg font-bold hover:bg-black hover:text-white transition-colors">
                LOAD MORE PRODUCTS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
