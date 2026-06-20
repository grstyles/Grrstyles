import { Product } from '@/lib/data/products';
import { mockStore } from '@/lib/providers/mockStore';

export interface SearchResult {
  products: Product[];
  total: number;
}

export const searchService = {
  /**
   * Searches the database for products matching the query.
   */
  async searchProducts(query: string): Promise<SearchResult> {
    const products = mockStore.getProducts();
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    if (!query) {
      return { products: [], total: 0 };
    }

    const cleanQuery = query.toLowerCase().trim();
    const matched = products.filter((p) => {
      const name = (p.name || p.title || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const brand = (p.brand || '').toLowerCase();

      return (
        name.includes(cleanQuery) ||
        desc.includes(cleanQuery) ||
        cat.includes(cleanQuery) ||
        brand.includes(cleanQuery)
      );
    });

    return {
      products: matched,
      total: matched.length,
    };
  },

  /**
   * Returns live suggestions as the user types.
   */
  async getSearchSuggestions(query: string): Promise<{
    suggestions: string[];
    products: Product[];
  }> {
    const products = mockStore.getProducts();
    if (!query || query.length < 2) {
      return { suggestions: [], products: [] };
    }

    const cleanQuery = query.toLowerCase().trim();
    const suggestionsSet = new Set<string>();
    const matchedProducts: Product[] = [];

    products.forEach((p) => {
      const name = p.name || p.title || '';
      const brand = p.brand || '';
      const cat = p.category || '';

      if (name.toLowerCase().includes(cleanQuery)) {
        suggestionsSet.add(name);
        if (matchedProducts.length < 5) {
          matchedProducts.push(p);
        }
      }
      if (brand.toLowerCase().includes(cleanQuery)) {
        suggestionsSet.add(brand);
      }
      if (cat.toLowerCase().includes(cleanQuery)) {
        suggestionsSet.add(cat);
      }
    });

    return {
      suggestions: Array.from(suggestionsSet).slice(0, 5),
      products: matchedProducts,
    };
  },
};
