import { supabase } from '@/lib/supabase';

export interface CategoryCarouselItem {
  id: string;
  title: string;
  slug: string;
  image_url: string;
  bg_color: string;
  priority: number;
  featured: boolean;
  redirect_link?: string;
  enabled: boolean;
}

export interface ICategoryCarouselRepository {
  getAll(): Promise<CategoryCarouselItem[]>;
  getActive(): Promise<CategoryCarouselItem[]>;
  update(id: string, updates: Partial<CategoryCarouselItem>): Promise<CategoryCarouselItem>;
  create(item: Omit<CategoryCarouselItem, 'id'>): Promise<CategoryCarouselItem>;
  delete(id: string): Promise<void>;
  updateOrder(items: { id: string; priority: number }[]): Promise<void>;
}

const sanitizeItem = (item: any): CategoryCarouselItem => {
  const imageSrc =
    typeof item.image_url === "string" && item.image_url.trim().length > 0
      ? item.image_url
      : "/images/category-placeholder.png";

  return {
    ...item,
    image_url: imageSrc,
  };
};

export class SupabaseCategoryCarouselRepository implements ICategoryCarouselRepository {
  async getAll(): Promise<CategoryCarouselItem[]> {
    const { data, error } = await supabase
      .from('category_carousel')
      .select('*')
      .order('priority', { ascending: true });
    
    if (error) {
      console.warn('Failed to fetch category_carousel. Table might not exist yet.', error);
      return [];
    }
    return (data || []).map(sanitizeItem);
  }

  async getActive(): Promise<CategoryCarouselItem[]> {
    const { data, error } = await supabase
      .from('category_carousel')
      .select('*')
      .eq('enabled', true)
      .order('priority', { ascending: true });
    
    if (error) {
      console.warn('Failed to fetch active category_carousel. Table might not exist yet.');
      return [];
    }
    const sanitized = (data || []).map(sanitizeItem);
    
    console.log("Fetched Categories:");
    sanitized.forEach(c => {
      console.log(`- title: ${c.title}, slug: ${c.slug}, image_url: ${c.image_url}, redirect: ${c.redirect_link}, enabled: ${c.enabled}, priority: ${c.priority}`);
    });
    
    return sanitized;
  }

  async update(id: string, updates: Partial<CategoryCarouselItem>): Promise<CategoryCarouselItem> {
    const { data, error } = await supabase
      .from('category_carousel')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return sanitizeItem(data);
  }

  async create(item: Omit<CategoryCarouselItem, 'id'>): Promise<CategoryCarouselItem> {
    const { data, error } = await supabase
      .from('category_carousel')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return sanitizeItem(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('category_carousel')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async updateOrder(items: { id: string; priority: number }[]): Promise<void> {
    // Supabase doesn't have a bulk update for different rows easily without a function,
    // so we will update them sequentially.
    for (const item of items) {
      await supabase
        .from('category_carousel')
        .update({ priority: item.priority })
        .eq('id', item.id);
    }
  }
}
