'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Heart, Search, PackageOpen, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function NoProductsFound({
  title = 'No Products Found',
  description = 'We couldn\'t find any products matching your active filters.',
  actionText = 'Clear Filters',
  onActionClick,
}: Omit<EmptyStateProps, 'actionHref'>) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-lg mx-auto my-12 animate-fadeIn">
      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-5">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>
      {onActionClick && (
        <button
          onClick={onActionClick}
          className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export function EmptyCartState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-md mx-auto my-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="w-20 h-20 bg-[#f5f0eb] text-[#8b7b6b] rounded-full flex items-center justify-center mb-6">
        <ShoppingBag size={36} className="stroke-[1.5]" />
      </div>
      <h2 className="text-2xl font-light text-[#1a1a1a] mb-3">Your Bag is Empty</h2>
      <p className="text-sm text-[#6b5b4b] mb-8 leading-relaxed">
        Choose from our premium selections and add some fresh confidence to your wardrobe.
      </p>
      <Link
        href="/collections"
        className="w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

export function EmptyWishlistState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-md mx-auto my-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="w-20 h-20 bg-[#fef2f2] text-red-400 rounded-full flex items-center justify-center mb-6">
        <Heart size={36} className="stroke-[1.5]" />
      </div>
      <h2 className="text-2xl font-light text-[#1a1a1a] mb-3">Your Wishlist is Empty</h2>
      <p className="text-sm text-[#6b5b4b] mb-8 leading-relaxed">
        Save items you love here to easily purchase or check them out later.
      </p>
      <Link
        href="/collections"
        className="w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center"
      >
        Explore Collection
      </Link>
    </div>
  );
}

export function NoSearchResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 max-w-md mx-auto my-12 bg-white border border-gray-100 rounded-3xl shadow-sm">
      <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mb-6">
        <Search size={36} className="stroke-[1.5]" />
      </div>
      <h2 className="text-2xl font-light text-[#1a1a1a] mb-3">No Results Found</h2>
      <p className="text-sm text-[#6b5b4b] mb-8 leading-relaxed">
        We couldn't find anything matching <strong className="text-black">"{query}"</strong>. Check spelling or try a different term.
      </p>
      <Link
        href="/collections"
        className="w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center"
      >
        Browse All Products
      </Link>
    </div>
  );
}

export function NoOrdersState() {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-lg mx-auto my-12">
      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-5">
        <PackageOpen size={28} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Found</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-sm">No simulated customer orders exist in the database.</p>
    </div>
  );
}
