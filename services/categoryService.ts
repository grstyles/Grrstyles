import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getCategoryImage, normalizeSlug } from '../lib/utils/categoryImageMap';

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
    description: 'Refined casual shirts crafted from premium linen and cotton blends.',
    image: '/images/categories/printed_shirts.png',
  },
  {
    id: '2',
    name: 'Printed Shirts',
    slug: 'printed-shirts',
    description: 'Oversized summer printed resort shirts designed for style and comfort.',
    image: '/images/categories/printed_shirts.png',
  },
  {
    id: '3',
    name: 'T-Shirts',
    slug: 't-shirts',
    description: 'Premium heavyweight and relaxed fit organic cotton tees.',
    image: '/images/categories/t_shirts.png',
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
    name: 'Night Tracks',
    slug: 'night-tracks',
    description: 'Premium lounge coordinates and cozy night wear track pants.',
    image: '/images/categories/category-placeholder.png',
  },
  {
    id: '6',
    name: 'Accessories',
    slug: 'accessories',
    description: 'Essential premium leather wallets, belts, caps, and beanies.',
    image: '/images/categories/accessories.png',
  },
  {
    id: '7',
    name: 'Formal Pant',
    slug: 'formal-pant',
    description: 'Tailored flat-front office trousers in luxury fabrics.',
    image: '/images/categories/trousers.png',
  },
  {
    id: '8',
    name: 'Formal Shirts',
    slug: 'formal-shirts',
    description: 'Crisp executive shirts designed for formal office hours.',
    image: '/images/categories/printed_shirts.png',
  },
  {
    id: '9',
    name: 'Trousers',
    slug: 'trousers',
    description: 'Tailored slim and relaxed fit trousers in luxury fabrics.',
    image: '/images/categories/trousers.png',
  },
  {
    id: '10',
    name: 'Denim Jeans',
    slug: 'denim-jeans',
    description: 'High-quality stone-washed wide leg and slim fit denim.',
    image: '/images/categories/denim_jeans.png',
  },
  {
    id: '11',
    name: 'Shoes',
    slug: 'shoes',
    description: 'Minimalist sneakers, loafers, and leather boots for modern style.',
    image: '/images/categories/shoes.png',
  }
];

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return mockCategories.map(c => ({
        ...c,
        image: getCategoryImage(c.name || c.slug)
      }));
    }

    try {
      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error || !data || data.length === 0) {
        return mockCategories.map(c => ({
          ...c,
          image: getCategoryImage(c.name || c.slug)
        }));
      }
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        slug: d.slug || normalizeSlug(d.name),
        description: d.description || '',
        image: d.image || getCategoryImage(d.name || d.slug),
      }));
    } catch (e) {
      return mockCategories.map(c => ({
        ...c,
        image: getCategoryImage(c.name || c.slug)
      }));
    }
  },

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    if (!isSupabaseConfigured()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.getLocalBySlug(slug);
    }

    try {
      const normalizedSlug = normalizeSlug(slug);
      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .eq('slug', normalizedSlug)
        .maybeSingle();

      if (error || !data) {
        return this.getLocalBySlug(slug);
      }

      return {
        id: data.id,
        name: data.name,
        slug: data.slug || normalizeSlug(data.name),
        description: data.description || '',
        image: data.image || getCategoryImage(data.name || data.slug),
      };
    } catch (e) {
      return this.getLocalBySlug(slug);
    }
  },

  getLocalBySlug(slug: string): Category | null {
    const normalizedSlug = normalizeSlug(slug);
    const cat = mockCategories.find((c) => normalizeSlug(c.slug) === normalizedSlug || normalizeSlug(c.name) === normalizedSlug);
    if (!cat) return null;
    return {
      ...cat,
      image: getCategoryImage(cat.name || cat.slug)
    };
  }
};

