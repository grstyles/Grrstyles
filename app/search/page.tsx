'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchService } from '@/services/searchService';
import { Product } from '@/lib/data/products';
import ProductGrid from '@/components/home/ProductGrid';
import { SearchLoader } from '@/components/ui/Skeletons';
import SearchDropdown from '@/components/navbar/SearchDropdown';
import { NoSearchResultsState } from '@/components/ui/EmptyStates';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setProductsList([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function fetchResults() {
      try {
        const result = await searchService.searchProducts(query);
        if (active) {
          setProductsList(result.products);
        }
      } catch (err) {
        console.error('Error fetching search results', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchResults();

    return () => {
      active = false;
    };
  }, [query]);

  if (loading) {
    return <SearchLoader />;
  }

  if (!query) {
    return (
      <div className="min-h-[70vh] bg-[#fcfbf9] py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-3xl p-4 sm:p-8 shadow-sm">
          <h1 className="text-xl sm:text-2xl font-light text-center text-gray-900 mb-4 tracking-wide uppercase">Search GR STYLES</h1>
          <div className="relative">
            <SearchDropdown onClose={() => {}} />
          </div>
        </div>
      </div>
    );
  }

  if (productsList.length === 0) {
    return <NoSearchResultsState query={query} />;
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 mb-6">
        <h1 className="text-2xl sm:text-3xl font-light text-gray-800 tracking-tight">
          Search Results for: <strong className="text-black uppercase">"{query}"</strong>
        </h1>
        <p className="text-sm text-gray-500 mt-1">Found {productsList.length} items matching your query.</p>
      </div>
      <ProductGrid products={productsList} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoader />}>
      <SearchResultsContent />
    </Suspense>
  );
}
