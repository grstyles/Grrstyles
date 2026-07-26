/**
 * Navigation Repository Implementation
 * Handles reading and updating Navigation Hero Images in Supabase & Local Fallback.
 */

import { getClient } from '@/lib/supabase';
import { INavigationRepository, NavigationHeroImage } from './interfaces';

const DEFAULT_PAGES: NavigationHeroImage[] = [
  {
    pageKey: 'new-in',
    pageName: 'New In',
    imageUrl: '/images/image1.jpeg',
  },
  {
    pageKey: 'mens',
    pageName: 'Mens',
    imageUrl: '/images/banners/banner-1.jpg',
  },
  {
    pageKey: 'collections',
    pageName: 'Collections',
    imageUrl: '/images/banners/banner-2.jpg',
  },
  {
    pageKey: 'sale',
    pageName: 'Sale',
    imageUrl: 'https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?q=80&w=2000&auto=format&fit=crop',
  },
];

// Memory cache / fallback store
const localStore: Record<string, NavigationHeroImage> = Object.fromEntries(
  DEFAULT_PAGES.map((p) => [p.pageKey, { ...p }])
);

export class SupabaseNavigationRepository implements INavigationRepository {
  private get sb() {
    return getClient();
  }

  async getAll(): Promise<NavigationHeroImage[]> {
    const client = this.sb;
    if (!client) {
      return Object.values(localStore);
    }

    try {
      const { data, error } = await client
        .from('navigation_hero_images')
        .select('*');

      if (error || !data || data.length === 0) {
        return DEFAULT_PAGES.map((def) => localStore[def.pageKey] || def);
      }

      const map: Record<string, NavigationHeroImage> = {};
      data.forEach((row: any) => {
        map[row.page_key] = {
          id: row.id,
          pageKey: row.page_key,
          pageName: row.page_name,
          imageUrl: row.image_url,
          updatedAt: row.updated_at,
        };
      });

      return DEFAULT_PAGES.map((def) => map[def.pageKey] || localStore[def.pageKey] || def);
    } catch (err) {
      return Object.values(localStore);
    }
  }

  async getByPage(pageKey: string): Promise<NavigationHeroImage | null> {
    const client = this.sb;
    const defaultItem = DEFAULT_PAGES.find((p) => p.pageKey === pageKey) || null;

    if (!client) {
      return localStore[pageKey] || defaultItem;
    }

    try {
      const { data, error } = await client
        .from('navigation_hero_images')
        .select('*')
        .eq('page_key', pageKey)
        .maybeSingle();

      if (error || !data) {
        return localStore[pageKey] || defaultItem;
      }

      return {
        id: data.id,
        pageKey: data.page_key,
        pageName: data.page_name,
        imageUrl: data.image_url,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      return localStore[pageKey] || defaultItem;
    }
  }

  async updateHeroImage(pageKey: string, imageUrl: string): Promise<NavigationHeroImage | null> {
    const defaultItem = DEFAULT_PAGES.find((p) => p.pageKey === pageKey);
    const pageName = defaultItem?.pageName || pageKey;

    localStore[pageKey] = {
      pageKey,
      pageName,
      imageUrl,
      updatedAt: new Date().toISOString(),
    };

    const client = this.sb;
    if (!client) {
      return localStore[pageKey];
    }

    try {
      const { data, error } = await client
        .from('navigation_hero_images')
        .upsert(
          {
            page_key: pageKey,
            page_name: pageName,
            image_url: imageUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_key' }
        )
        .select('*')
        .single();

      if (error) {
        return localStore[pageKey];
      }

      return {
        id: data.id,
        pageKey: data.page_key,
        pageName: data.page_name,
        imageUrl: data.image_url,
        updatedAt: data.updated_at,
      };
    } catch (err) {
      return localStore[pageKey];
    }
  }

  async deleteHeroImage(pageKey: string): Promise<boolean> {
    const defaultItem = DEFAULT_PAGES.find((p) => p.pageKey === pageKey);
    const defaultUrl = defaultItem?.imageUrl || '';

    localStore[pageKey] = {
      pageKey,
      pageName: defaultItem?.pageName || pageKey,
      imageUrl: defaultUrl,
      updatedAt: new Date().toISOString(),
    };

    const client = this.sb;
    if (!client) return true;

    try {
      await client
        .from('navigation_hero_images')
        .upsert(
          {
            page_key: pageKey,
            page_name: defaultItem?.pageName || pageKey,
            image_url: defaultUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'page_key' }
        );
      return true;
    } catch (err) {
      return true;
    }
  }
}
