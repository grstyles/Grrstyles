import { getClient } from '@/lib/supabase';
const sb = () => getClient()!;

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

export const DEFAULT_CATEGORIES: CategoryCarouselItem[] = [
  { id: '1', title: 'Combo Offers', slug: 'combo-offers', image_url: '/images/categories/home_hero_banner_1781859591521.png', bg_color: '#F9F7F5', priority: 0, featured: false, enabled: true },
  { id: '2', title: 'Korean Collections', slug: 'korean-collections', image_url: '/images/categories/korean_collection_1781859616593.png', bg_color: '#F9F7F5', priority: 1, featured: false, enabled: true },
  { id: '3', title: 'Baggy Pants', slug: 'baggy-pants', image_url: '/images/categories/baggy_pants_1782999816436.png', bg_color: '#F9F7F5', priority: 2, featured: false, enabled: true },
  { id: '4', title: 'Korean Trousers', slug: 'korean-trousers', image_url: '/images/categories/trousers_1781973187005.png', bg_color: '#F9F7F5', priority: 3, featured: false, enabled: true },
  { id: '5', title: 'Shoes', slug: 'shoes', image_url: '/images/categories/shoes_1781859704333.png', bg_color: '#F9F7F5', priority: 4, featured: false, enabled: true },
  { id: '6', title: 'Traditional Collections', slug: 'traditional-collections', image_url: '/images/categories/festival_wear.png', bg_color: '#F9F7F5', priority: 5, featured: false, enabled: true },
  { id: '7', title: 'Festival Wear', slug: 'festival-wear', image_url: '/images/categories/festival_wear.png', bg_color: '#F9F7F5', priority: 6, featured: false, enabled: true },
];

const STORAGE_KEY = 'gr_category_carousel_items_v2';
let memoryStore: CategoryCarouselItem[] | null = null;

const sanitizeItem = (item: any): CategoryCarouselItem => {
  if (!item) {
    return {
      id: `cat_${Date.now()}`,
      title: '',
      slug: '',
      image_url: '/images/category-placeholder.png',
      bg_color: '#f5f0eb',
      priority: 0,
      featured: false,
      enabled: true,
    };
  }
  const imageSrc =
    typeof item.image_url === "string" && item.image_url.trim().length > 0
      ? item.image_url
      : "/images/category-placeholder.png";

  return {
    id: String(item.id || `cat_${Date.now()}`),
    title: item.title || '',
    slug: item.slug || '',
    image_url: imageSrc,
    bg_color: item.bg_color || '#f5f0eb',
    priority: typeof item.priority === 'number' ? item.priority : 0,
    featured: Boolean(item.featured),
    redirect_link: item.redirect_link || '',
    enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
  };
};

const DELETED_KEY = 'gr_category_carousel_deleted_v2';

function getDeletedIds(): Set<string> {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(DELETED_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch (e) {}
  }
  return new Set();
}

function addDeletedId(id: string): void {
  const set = getDeletedIds();
  set.add(id);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {}
  }
}

function loadLocalItems(): CategoryCarouselItem[] {
  if (memoryStore && memoryStore.length > 0) return memoryStore;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryStore = parsed.map(sanitizeItem);
          return memoryStore;
        }
      }
    } catch (e) {
      console.warn('Failed to load category carousel items from localStorage', e);
    }
  }
  memoryStore = DEFAULT_CATEGORIES.map(sanitizeItem);
  return memoryStore;
}

function saveLocalItems(items: CategoryCarouselItem[]): void {
  memoryStore = items;
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event('category_carousel_updated'));
    } catch (e) {
      console.warn('Failed to save category carousel items to localStorage', e);
    }
  }
}

function mergeItems(remoteItems: CategoryCarouselItem[] = []): CategoryCarouselItem[] {
  const deleted = getDeletedIds();
  const map = new Map<string, CategoryCarouselItem>();

  // If remote items exist, use remote items as primary truth
  if (remoteItems && remoteItems.length > 0) {
    remoteItems.forEach(item => {
      if (item && item.id && !deleted.has(item.id)) {
        map.set(item.id, sanitizeItem(item));
      }
    });
    return Array.from(map.values()).sort((a, b) => a.priority - b.priority);
  }

  // Fallback to local storage items
  const local = loadLocalItems();
  local.forEach(item => {
    if (item && item.id && !deleted.has(item.id)) {
      map.set(item.id, sanitizeItem(item));
    }
  });

  return Array.from(map.values()).sort((a, b) => a.priority - b.priority);
}

export class SupabaseCategoryCarouselRepository implements ICategoryCarouselRepository {
  private get client() {
    return getClient();
  }

  async getAll(): Promise<CategoryCarouselItem[]> {
    let remote: CategoryCarouselItem[] | null = null;

    // Try fetching via API route first (which uses service role key on server)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/category-carousel');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            remote = json.data.map(sanitizeItem);
          }
        }
      } catch (e) {
        console.warn('[CategoryCarouselRepo] API GET failed, trying direct client:', e);
      }
    }

    if (remote === null) {
      const client = this.client;
      if (client) {
        try {
          const { data, error } = await client
            .from('category_carousel')
            .select('*')
            .order('priority', { ascending: true });
          
          if (!error && Array.isArray(data) && data.length > 0) {
            remote = data.map(sanitizeItem);
          }
        } catch (error) {}
      }
    }

    const merged = mergeItems(remote || []);
    saveLocalItems(merged);
    return merged;
  }

  async getActive(): Promise<CategoryCarouselItem[]> {
    const all = await this.getAll();
    return all.filter(c => c.enabled);
  }

  async update(id: string, updates: Partial<CategoryCarouselItem>): Promise<CategoryCarouselItem> {
    const { id: _id, ...cleanUpdates } = (updates || {}) as any;
    const localList = loadLocalItems();
    const existing = localList.find(c => c.id === id);
    let updatedResult = sanitizeItem({ ...(existing || {}), ...cleanUpdates, id });

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/admin/category-carousel/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanUpdates),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            updatedResult = sanitizeItem(json.data);
          }
        }
      } catch (e) {
        console.warn(`[CategoryCarouselRepo] API PATCH /${id} failed:`, e);
      }
    }

    const newList = localList.map(c => c.id === id ? updatedResult : c);
    saveLocalItems(newList);
    return updatedResult;
  }

  async create(item: Omit<CategoryCarouselItem, 'id'>): Promise<CategoryCarouselItem> {
    const { id: _id, ...cleanItem } = (item || {}) as any;
    const localList = loadLocalItems();
    let createdResult = sanitizeItem({ id: `cat_${Date.now()}`, priority: localList.length, ...cleanItem });

    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/admin/category-carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cleanItem),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            createdResult = sanitizeItem(json.data);
          }
        }
      } catch (e) {
        console.warn('[CategoryCarouselRepo] API POST failed:', e);
      }
    }

    const newList = [...localList, createdResult];
    saveLocalItems(newList);
    return createdResult;
  }

  async delete(id: string): Promise<void> {
    addDeletedId(id);
    const localList = loadLocalItems();

    if (typeof window !== 'undefined') {
      try {
        await fetch(`/api/admin/category-carousel/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn(`[CategoryCarouselRepo] API DELETE /${id} failed:`, e);
      }
    }

    const newList = localList.filter(c => c.id !== id);
    saveLocalItems(newList);
  }

  async updateOrder(items: { id: string; priority: number }[]): Promise<void> {
    const localList = loadLocalItems();
    const orderMap = new Map(items.map(i => [i.id, i.priority]));
    const reordered = localList
      .map(c => orderMap.has(c.id) ? { ...c, priority: orderMap.get(c.id)! } : c)
      .sort((a, b) => a.priority - b.priority);

    saveLocalItems(reordered);

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/admin/category-carousel/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
      } catch (e) {
        console.warn('[CategoryCarouselRepo] API POST /reorder failed:', e);
      }
    }
  }
}
