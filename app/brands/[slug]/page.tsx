'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/services/productService';
import { Product } from '@/lib/data/products';
import ProductGrid from '@/components/home/ProductGrid';
import { CategorySkeleton } from '@/components/ui/Skeletons';
import { NoProductsFound } from '@/components/ui/EmptyStates';

export default function BrandPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setLoading(true);

    async function loadData() {
      try {
        const prodData = await productService.getProductsByBrand(slug);
        if (active) {
          setProductsList(prodData);
        }
      } catch (err) {
        console.error('Error loading brand page data', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <CategorySkeleton />;
  }

  const brandTitle = slug.replace(/-/g, ' ');
  const brandDesc = `Shop genuine apparel and exclusive drops from ${brandTitle}.`;

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-8 sm:py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-gray-800 tracking-tight uppercase">
          {brandTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {brandDesc}
        </p>
      </div>

      {productsList.length > 0 ? (
        <ProductGrid products={productsList} />
      ) : (
        <NoProductsFound
          title="No Products Found"
          description={`We couldn't find any products manufactured by the brand ${brandTitle}.`}
        />
      )}
    </div>
  );
}
