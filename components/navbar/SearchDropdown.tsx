'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, X, Loader2, ArrowRight } from 'lucide-react';
import { searchService } from '@/services/searchService';
import { Product } from '@/lib/data/products';
import { formatPrice } from '@/lib/utils/helpers';

interface SearchDropdownProps {
  onClose: () => void;
}

export default function SearchDropdown({ onClose }: SearchDropdownProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle ESC key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setMatchedProducts([]);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { suggestions: sugg, products: prods } = await searchService.getSearchSuggestions(query);
        setSuggestions(sugg);
        setMatchedProducts(prods);
      } catch (err) {
        console.error('Error fetching suggestions', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onClose();
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto animate-slideDown"
    >
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {/* Search Bar Input */}
        <form onSubmit={handleSearchSubmit} className="relative mb-6">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search premium apparel, collections, or accessories..."
            className="w-full pl-12 pr-12 py-3.5 border-b-2 border-gray-200 focus:border-black text-sm md:text-base font-light tracking-wide placeholder-gray-400 focus:outline-none transition-all uppercase"
          />
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          {loading ? (
            <Loader2 size={18} className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <X size={18} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black border border-gray-200 hover:border-black p-1.5 rounded-full transition-colors"
            title="Close Search"
          >
            <X size={16} />
          </button>
        </form>

        {/* Suggestion & Matching Results Layout */}
        {(suggestions.length > 0 || matchedProducts.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
            {/* suggestions list */}
            {suggestions.length > 0 && (
              <div className="md:col-span-1 space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Suggestions</h4>
                <ul className="space-y-2">
                  {suggestions.map((sugg, i) => (
                    <li key={i}>
                      <button
                        onClick={() => handleSuggestionClick(sugg)}
                        className="text-xs text-gray-600 hover:text-black font-semibold flex items-center gap-2 w-full text-left uppercase transition-colors"
                      >
                        <Search size={12} className="text-gray-300 flex-shrink-0" />
                        <span className="truncate">{sugg}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* matching products list */}
            {matchedProducts.length > 0 && (
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Product Matches</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {matchedProducts.map((p) => {
                    const price = p.sellingPrice || p.discountedPrice || p.price || 0;
                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        className="flex gap-3 items-center group p-2 hover:bg-gray-50 rounded-xl transition-all border border-gray-100/50"
                      >
                        <div className="relative w-12 h-16 bg-[#f5f0eb] rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={p.images?.[0] || '/placeholder.png'}
                            alt={p.name || p.title || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="60px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-bold tracking-wider text-[#D4AF37] uppercase">{p.brand || 'GR Styles'}</p>
                          <h5 className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-[#8b7b6b] transition-colors uppercase">
                            {p.name || p.title}
                          </h5>
                          <p className="text-xs font-bold text-gray-900 mt-0.5">{formatPrice(price)}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* view all button */}
                <button
                  onClick={handleSearchSubmit}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  View All Results <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty placeholder guide */}
        {!query && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-400 font-light">Type at least 2 characters to see recommendations.</p>
            <div className="flex justify-center gap-2 flex-wrap mt-4">
              {['Shirts', 'Jeans', 'Jackets', 'Sneakers'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3.5 py-1.5 border border-gray-200 hover:border-black rounded-full text-xs text-gray-600 hover:text-black uppercase font-medium transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
