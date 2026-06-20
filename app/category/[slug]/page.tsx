'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';
import { Product } from '@/lib/data/products';
import ProductGrid from '@/components/home/ProductGrid';
import { CategorySkeleton } from '@/components/ui/Skeletons';
import { NoProductsFound } from '@/components/ui/EmptyStates';

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setLoading(true);

    async function loadData() {
      try {
        const [catData, prodData] = await Promise.all([
          categoryService.getCategoryBySlug(slug),
          productService.getProductsByCategory(slug),
        ]);

        if (active) {
          setCategory(catData);
          setProductsList(prodData);
        }
      } catch (err) {
        console.error('Error loading category page data', err);
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

  // Fallback category header metadata if not in categories database
  const categoryTitle = category ? category.name : slug.replace(/-/g, ' ');
  const categoryDesc = category ? category.description : `Premium essentials from our ${slug.replace(/-/g, ' ')} catalog.`;

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-8 sm:py-12">
      {/* Category Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-gray-800 tracking-tight uppercase">
          {categoryTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {categoryDesc}
        </p>
      </div>

      {productsList.length > 0 ? (
        <ProductGrid products={productsList} />
      ) : (
        <NoProductsFound
          title="No Products in Category"
          description={`We couldn't find any products in the ${categoryTitle} category.`}
        />
      )}
    </div>
  );
}
