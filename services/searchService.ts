import { Product } from '@/lib/data/products';
import { supabase } from '@/lib/supabase';
import { mapDbProduct } from './productService';

export interface SearchResult {
  products: Product[];
  total: number;
}

export const searchService = {
  /**
   * Searches the database for products matching the query.
   */
  async searchProducts(query: string): Promise<SearchResult> {
    if (!query) {
      return { products: [], total: 0 };
    }

    const cleanQuery = query.trim();
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%`);

    if (error) throw error;
    if (!data) return { products: [], total: 0 };

    const products = data.map(mapDbProduct);
    return {
      products,
      total: products.length,
    };
  },

  /**
   * Returns live suggestions as the user types.
   */
  async getSearchSuggestions(query: string): Promise<{
    suggestions: string[];
    products: Product[];
  }> {
    if (!query || query.length < 2) {
      return { suggestions: [], products: [] };
    }

    const cleanQuery = query.trim();
    const { data, error } = await supabase!
      .from('products')
      .select('*')
      .or(`name.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
      .limit(10);

    if (error) throw error;
    if (!data) return { suggestions: [], products: [] };

    const products = data.map(mapDbProduct);
    const suggestionsSet = new Set<string>();

    products.forEach((p) => {
      const name = p.name || p.title || '';
      const brand = p.brand || '';
      const cat = p.category || '';

      if (name.toLowerCase().includes(cleanQuery.toLowerCase())) {
        suggestionsSet.add(name);
      }
      if (brand.toLowerCase().includes(cleanQuery.toLowerCase())) {
        suggestionsSet.add(brand);
      }
      if (cat.toLowerCase().includes(cleanQuery.toLowerCase())) {
        suggestionsSet.add(cat);
      }
    });

    return {
      suggestions: Array.from(suggestionsSet).slice(0, 5),
      products: products.slice(0, 5),
    };
  },
};
