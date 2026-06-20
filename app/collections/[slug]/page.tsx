'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { productService } from '@/services/productService';
import { Product } from '@/lib/data/products';
import ProductGrid from '@/components/home/ProductGrid';
import { CategorySkeleton } from '@/components/ui/Skeletons';
import { NoProductsFound } from '@/components/ui/EmptyStates';

export default function CollectionPage() {
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
        const prodData = await productService.getProductsByCollection(slug);
        if (active) {
          setProductsList(prodData);
        }
      } catch (err) {
        console.error('Error loading collection page data', err);
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

  const collectionTitle = slug.replace(/-/g, ' ');
  const collectionDesc = `Explore our curated selection for the ${collectionTitle} range, handpicked for quality and comfort.`;

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-8 sm:py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 mb-8">
        <h1 className="text-3xl sm:text-4xl font-light text-gray-800 tracking-tight uppercase">
          {collectionTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          {collectionDesc}
        </p>
      </div>

      {productsList.length > 0 ? (
        <ProductGrid products={productsList} />
      ) : (
        <NoProductsFound
          title="No Products in Collection"
          description={`We couldn't find any products in the ${collectionTitle} collection.`}
        />
      )}
    </div>
  );
}
