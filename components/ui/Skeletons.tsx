'use client';

import React from 'react';

// Common tailwind classes for modern skeletons: animate-pulse, bg-gray-200/80, rounded-xl etc.
export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100/50 p-3 space-y-4 animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-[3/4] bg-gray-200 rounded-xl" />
      {/* Brand & Title Skeletons */}
      <div className="space-y-2">
        <div className="h-3 w-1/4 bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
      {/* Price Skeleton */}
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-10 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12 animate-pulse space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>
      {/* Grid of Product Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, idx) => (
          <ProductSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

export function SearchLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12 animate-pulse space-y-8">
      <div className="flex flex-col gap-2">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-64 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, idx) => (
          <ProductSkeleton key={idx} />
        ))}
      </div>
    </div>
  );
}

export function CartLoader() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded-lg" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-4 p-4 border border-gray-100 rounded-2xl">
              <div className="w-20 h-24 bg-gray-200 rounded-xl" />
              <div className="flex-1 space-y-3 py-2">
                <div className="h-3 w-1/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-3 w-1/3 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-3xl p-6 h-64 space-y-4">
          <div className="h-5 w-1/3 bg-gray-200 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="h-10 w-full bg-gray-200 rounded-xl pt-4" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">GR STYLES</p>
      </div>
    </div>
  );
}
