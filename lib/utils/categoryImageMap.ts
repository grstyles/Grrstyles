/**
 * GR STYLES – Centralized Catalog Normalization System
 * ===================================================
 * Single source of truth for all category and collection normalization,
 * slug generation, local image mappings, and fuzzy matching.
 */

/**
 * Generates a clean URL-friendly slug.
 */
export function normalizeSlug(value: string): string {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special characters with hyphens
    .replace(/^-+|-+$/g, '');   // Trim leading/trailing hyphens
}

/**
 * Normalizes category values to approved categories only.
 */
export function normalizeCategory(category: string): string {
  if (!category) return '';
  const val = category.toLowerCase().trim().replace(/-/g, ' ');

  // Direct mapping to approved categories:
  if (val === 'shirt' || val === 'shirts') return 'shirts';
  if (val === 'printed shirt' || val === 'printed shirts' || val === 'printed-shirt' || val === 'printed-shirts') return 'printed-shirts';
  if (val === 't shirt' || val === 'tshirts' || val === 't-shirt' || val === 't-shirts' || val === 't shirts' || val === 'tshirt' || val === 'polo shirt' || val === 'polo shirts') return 't-shirts';
  if (val === 'jacket' || val === 'jackets' || val === 'hoodie' || val === 'hoodies' || val === 'sweatshirt' || val === 'sweatshirts' || val === 'blazer' || val === 'blazers') return 'jackets';
  if (val === 'night track' || val === 'night tracks' || val === 'nighttrack' || val === 'night-tracks' || val === 'nighttracks') return 'night-tracks';
  if (val === 'formal pant' || val === 'formal pants' || val === 'formal-pant' || val === 'formal-pants' || val === 'pant' || val === 'pants') return 'formal-pant';
  if (val === 'formal shirt' || val === 'formal shirts' || val === 'formal-shirt' || val === 'formal-shirts') return 'formal-shirts';
  if (val === 'trouser' || val === 'trousers' || val === 'chinos' || val === 'chino' || val === 'cargo' || val === 'cargos') return 'trousers';
  if (val === 'jeans' || val === 'denim' || val === 'denim jeans' || val === 'denim-jeans') return 'denim-jeans';
  if (val === 'sneakers' || val === 'shoes' || val === 'sneaker' || val === 'shoe' || val === 'footwear') return 'shoes';
  if (val === 'accessories' || val === 'accessory' || val === 'watch' || val === 'watches' || val === 'belt' || val === 'belts' || val === 'wallet' || val === 'wallets' || val === 'cap' || val === 'caps' || val === 'sunglasses' || val === 'sunglass' || val === 'perfume' || val === 'perfumes') return 'accessories';

  return normalizeSlug(category);
}

/**
 * Normalizes collection values to approved collections only.
 */
export function normalizeCollection(collection: string): string {
  if (!collection) return '';
  const val = collection.toLowerCase().trim().replace(/-/g, ' ');

  if (val === 'korean collection' || val === 'korean collections') return 'korean-collections';
  if (val === 'trending collection' || val === 'trending collections') return 'trending-collections';
  if (val === 'baggy pant' || val === 'baggy pants') return 'baggy-pants';
  if (val === 'korean trouser' || val === 'korean trousers') return 'korean-trousers';
  if (val === 'traditional collection' || val === 'traditional collections') return 'traditional-collections';
  if (val === 'festival collection' || val === 'festival collections' || val === 'festival wear') return 'festival-collections';
  if (val === 'combo offer' || val === 'combo offers' || val === 'combos') return 'combo-offers';
  if (val === 'festival offer' || val === 'festival offers') return 'festival-offers';
  if (val === 'weekend offer' || val === 'weekend offers') return 'weekend-offers';
  if (val === 'formal combo' || val === 'formal combos') return 'formal-combos';
  if (val === 'deal of the day' || val === 'deal of day' || val === 'deals') return 'deal-of-the-day';
  if (val === 'shoes' || val === 'shoe') return 'shoes';

  return normalizeSlug(collection);
}

/**
 * Image map for all approved categories and collections.
 */
const IMAGE_MAP: Record<string, string> = {
  'shirts': '/images/categories/printed_shirts.png',
  'printed-shirts': '/images/categories/printed_shirts.png',
  't-shirts': '/images/categories/t_shirts.png',
  'jackets': '/images/categories/jackets.png',
  'night-tracks': '/images/categories/category-placeholder.png',
  'accessories': '/images/categories/accessories.png',
  'formal-pant': '/images/categories/trousers.png',
  'formal-shirts': '/images/categories/printed_shirts.png',
  'trousers': '/images/categories/trousers.png',
  'denim-jeans': '/images/categories/denim_jeans.png',
  'shoes': '/images/categories/shoes.png',
  // Collections:
  'korean-collections': '/images/categories/korean_collection.png',
  'trending-collections': '/images/categories/category-placeholder.png',
  'baggy-pants': '/images/categories/baggy_pants.png',
  'korean-trousers': '/images/categories/korean_collection.png',
  'traditional-collections': '/images/categories/festival_wear.png',
  'festival-collections': '/images/categories/festival_wear.png',
  'combo-offers': '/images/categories/category-placeholder.png',
  'festival-offers': '/images/categories/festival_wear.png',
  'weekend-offers': '/images/categories/category-placeholder.png',
  'formal-combos': '/images/categories/formal_wear.png',
  'deal-of-the-day': '/images/categories/category-placeholder.png'
};

/**
 * Resolves any category name or slug to its local image path.
 */
export function getCategoryImage(categoryNameOrSlug: string): string {
  if (!categoryNameOrSlug) return '/images/categories/category-placeholder.png';
  const key = normalizeSlug(categoryNameOrSlug);
  return IMAGE_MAP[key] || '/images/categories/category-placeholder.png';
}

/**
 * Matches products to categories or collections, resolving synonyms dynamically.
 */
export function matchCategory(product: any, slug: string): boolean {
  if (!product || !slug) return false;

  const target = normalizeSlug(slug);
  const prodCat = normalizeCategory(product.category || '');
  const prodTitle = (product.title || product.name || '').toLowerCase();
  const prodDesc = (product.description || '').toLowerCase();
  const prodColl = normalizeCollection(product.collection || '');

  // 1. Direct match on category or collection
  if (prodCat === target || prodColl === target) return true;

  // 2. Collection specific text overrides
  if (target === 'korean-collections') {
    return (
      prodColl === 'korean-collections' ||
      prodTitle.includes('korean') ||
      prodDesc.includes('korean')
    );
  }

  if (target === 'trending-collections') {
    return (
      prodColl === 'trending-collections' ||
      product.bestSeller ||
      product.featured ||
      product.trending ||
      product.label === 'HOT'
    );
  }

  if (target === 'deal-of-the-day') {
    return (
      prodColl === 'deal-of-the-day' ||
      !!product.metadata?.dealOfDay ||
      !!product.dealOfDay
    );
  }

  if (target === 'baggy-pants') {
    return (
      prodColl === 'baggy-pants' ||
      prodTitle.includes('baggy') ||
      prodDesc.includes('baggy')
    );
  }

  if (target === 'korean-trousers') {
    return (
      prodColl === 'korean-trousers' ||
      (prodTitle.includes('korean') && (prodTitle.includes('trouser') || prodTitle.includes('pant') || prodTitle.includes('trousers') || prodTitle.includes('pants')))
    );
  }

  if (target === 'traditional-collections') {
    return (
      prodColl === 'traditional-collections' ||
      prodTitle.includes('traditional') ||
      prodTitle.includes('ethnic') ||
      prodDesc.includes('traditional') ||
      prodDesc.includes('ethnic')
    );
  }

  if (target === 'festival-collections') {
    return (
      prodColl === 'festival-collections' ||
      prodTitle.includes('festival') ||
      prodDesc.includes('festival')
    );
  }

  if (target === 'combo-offers') {
    return (
      prodColl === 'combo-offers' ||
      prodTitle.includes('combo') ||
      prodTitle.includes('pack of') ||
      prodTitle.includes('bundle')
    );
  }

  if (target === 'festival-offers') {
    return (
      prodColl === 'festival-offers' ||
      (prodTitle.includes('festival') && (product.discountPercent && product.discountPercent > 20))
    );
  }

  if (target === 'weekend-offers') {
    return (
      prodColl === 'weekend-offers' ||
      prodTitle.includes('weekend') ||
      prodDesc.includes('weekend')
    );
  }

  if (target === 'formal-combos') {
    return (
      prodColl === 'formal-combos' ||
      (prodTitle.includes('formal') && (prodTitle.includes('combo') || prodTitle.includes('pack') || prodTitle.includes('bundle')))
    );
  }

  // 3. Synonym mappings for categories:
  const groups: Record<string, string[]> = {
    'shirts': ['shirts'],
    'printed-shirts': ['printed-shirts'],
    't-shirts': ['t-shirts'],
    'jackets': ['jackets'],
    'night-tracks': ['night-tracks'],
    'accessories': ['accessories'],
    'formal-pant': ['formal-pant'],
    'formal-shirts': ['formal-shirts'],
    'trousers': ['trousers'],
    'denim-jeans': ['denim-jeans'],
    'shoes': ['shoes']
  };

  const allowed = groups[target];
  if (allowed) {
    return allowed.includes(prodCat);
  }

  return false;
}
