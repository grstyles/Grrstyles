import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Shirts',
    slug: 'shirts',
    description: 'Refined shirts crafted from premium linen and cotton blends.',
    image: '/images/categories/printed_shirts.png',
  },
  {
    id: '2',
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Premium heavyweight and relaxed fit cotton tees.',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600',
  },
  {
    id: '3',
    name: 'Trousers',
    slug: 'trousers',
    description: 'Tailored slim and relaxed fit trousers in luxury fabrics.',
    image: 'https://images.unsplash.com/photo-1473617231723-2a5ebf1379b7?q=80&w=600',
  },
  {
    id: '4',
    name: 'Jackets',
    slug: 'jackets',
    description: 'Classic denim, bomber, and utility jackets designed for layering.',
    image: '/images/categories/jackets.png',
  },
  {
    id: '5',
    name: 'Hoodies',
    slug: 'hoodies',
    description: 'Cozy loopback cotton and fleece-lined streetwear hoodies.',
    image: 'https://images.unsplash.com/photo-1556821552-5ff63b1b5786?q=80&w=600',
  },
  {
    id: '6',
    name: 'Jeans',
    slug: 'jeans',
    description: 'High-quality stone-washed wide leg and slim fit denim.',
    image: '/images/categories/denim_jeans.png',
  },
  {
    id: '7',
    name: 'Sweatshirts',
    slug: 'sweatshirts',
    description: 'Minimalist crew neck pullovers in heavyweight cotton.',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=600',
  },
  {
    id: '8',
    name: 'Shoes',
    slug: 'shoes',
    description: 'Minimalist sneakers, loafers, and leather boots for modern style.',
    image: '/images/categories/shoes.png',
  },
  {
    id: '9',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Essential premium leather wallets, belts, watches, and beanies.',
    image: '/images/categories/accessories.png',
  }
];

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return mockCategories;
    }

    try {
      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) return mockCategories;
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        description: d.description || '',
        image: d.image || '',
      }));
    } catch (e) {
      return mockCategories;
    }
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getLocalBySlug(slug);
    }

    try {
      const normalizedSlug = slug.toLowerCase().trim();
      const slugMap: Record<string, string> = {
        'sneakers': 'shoes',
        'footwear': 'shoes',
        'polo-shirts': 't-shirts',
        'blazers': 'jackets',
        'watches': 'accessories',
        'formal': 'trousers'
      };

      const targetSlug = slugMap[normalizedSlug] || normalizedSlug;
      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (error || !data) {
        return this.getLocalBySlug(slug);
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        image: data.image || '',
      };
    } catch (e) {
      return this.getLocalBySlug(slug);
    }
  },

  getLocalBySlug(slug: string): Category | null {
    const normalizedSlug = slug.toLowerCase().trim();
    const slugMap: Record<string, string> = {
      'sneakers': 'shoes',
      'footwear': 'shoes',
      'polo-shirts': 't-shirts',
      'blazers': 'jackets',
      'watches': 'accessories',
      'formal': 'trousers'
    };
    const targetSlug = slugMap[normalizedSlug] || normalizedSlug;
    return mockCategories.find((c) => c.slug === targetSlug) || null;
  }
};

