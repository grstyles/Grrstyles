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
  if (val === 'korean collection' || val === 'korean collections' || val === 'korean-collection' || val === 'korean-collections') return 'korean-collections';
  if (val === 'traditional collection' || val === 'traditional collections' || val === 'traditional-collection' || val === 'traditional-collections') return 'traditional-collections';
  if (val === 'insta viral collection' || val === 'insta viral collections' || val === 'insta-viral-collection' || val === 'insta-viral-collections' || val === 'insta viral' || val === 'insta-viral' || val === 'instaviral') return 'insta-viral-collections';

  return normalizeSlug(category);
}

/**
 * Normalizes collection values to approved collections only.
 */
export function normalizeCollection(collection: string): string {
  if (!collection) return '';
  const val = collection.toLowerCase().trim().replace(/-/g, ' ');

  if (val === 'insta viral collection' || val === 'insta viral collections' || val === 'insta-viral-collection' || val === 'insta-viral-collections' || val === 'insta viral' || val === 'insta-viral' || val === 'instaviral') return 'insta-viral-collections';
  if (val === 'korean collection' || val === 'korean collections' || val === 'korean-collection' || val === 'korean-collections') return 'korean-collections';
  if (val === 'trending collection' || val === 'trending collections' || val === 'trending-collection' || val === 'trending-collections') return 'trending-collections';
  if (val === 'baggy pant' || val === 'baggy pants' || val === 'baggy-pant' || val === 'baggy-pants') return 'baggy-pants';
  if (val === 'korean trouser' || val === 'korean trousers' || val === 'korean-trouser' || val === 'korean-trousers') return 'korean-trousers';
  if (val === 'traditional collection' || val === 'traditional collections' || val === 'traditional-collection' || val === 'traditional-collections') return 'traditional-collections';
  if (val === 'festival collection' || val === 'festival collections' || val === 'festive collection' || val === 'festive collections' || val === 'festival wear' || val === 'festival-collection' || val === 'festival-collections' || val === 'festive-collection') return 'festival-collections';
  if (val === 'combo offer' || val === 'combo offers' || val === 'combos' || val === 'combo-offer' || val === 'combo-offers') return 'combo-offers';
  if (val === 'festival offer' || val === 'festival offers' || val === 'festival-offer' || val === 'festival-offers') return 'festival-offers';
  if (val === 'weekend offer' || val === 'weekend offers' || val === 'weekend-offer' || val === 'weekend-offers') return 'weekend-offers';
  if (val === 'formal combo' || val === 'formal combos' || val === 'formal-combo' || val === 'formal-combos') return 'formal-combos';
  if (val === 'deal of the day' || val === 'deal of day' || val === 'deals' || val === 'deal-of-the-day') return 'deal-of-the-day';
  if (val === 'new arrivals' || val === 'new arrival' || val === 'new-arrivals' || val === 'new-arrival') return 'new-arrivals';
  if (val === 'best sellers' || val === 'best seller' || val === 'bestsellers' || val === 'bestseller' || val === 'best-sellers' || val === 'best-seller') return 'best-sellers';
  if (val === 'premium collection' || val === 'premium collections' || val === 'premium-collection' || val === 'premium-collections') return 'premium-collection';
  if (val === 'featured collection' || val === 'featured collections' || val === 'featured-collection' || val === 'featured-collections') return 'featured-collection';
  if (val === 'seasonal collection' || val === 'seasonal collections' || val === 'seasonal-collection' || val === 'seasonal-collections' || val === 'summer collection' || val === 'winter collection') return 'seasonal-collection';
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
  'insta-viral-collections': '/images/categories/category-placeholder.png',
  'insta-viral-collection': '/images/categories/category-placeholder.png',
  'insta-viral': '/images/categories/category-placeholder.png',
  'korean-collections': '/images/categories/korean_collection.png',
  'korean-collection': '/images/categories/korean_collection.png',
  'trending-collections': '/images/categories/category-placeholder.png',
  'trending-collection': '/images/categories/category-placeholder.png',
  'baggy-pants': '/images/categories/baggy_pants.png',
  'korean-trousers': '/images/categories/korean_collection.png',
  'traditional-collections': '/images/categories/festival_wear.png',
  'traditional-collection': '/images/categories/festival_wear.png',
  'festival-collections': '/images/categories/festival_wear.png',
  'festive-collection': '/images/categories/festival_wear.png',
  'combo-offers': '/images/categories/category-placeholder.png',
  'festival-offers': '/images/categories/festival_wear.png',
  'weekend-offers': '/images/categories/category-placeholder.png',
  'formal-combos': '/images/categories/formal_wear.png',
  'deal-of-the-day': '/images/categories/category-placeholder.png',
  'new-arrivals': '/images/categories/category-placeholder.png',
  'best-sellers': '/images/categories/category-placeholder.png',
  'premium-collection': '/images/categories/category-placeholder.png',
  'featured-collection': '/images/categories/category-placeholder.png',
  'seasonal-collection': '/images/categories/category-placeholder.png',
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
  const targetNorm = normalizeCollection(slug);
  const prodCat = normalizeCategory(product.category || '');
  const rawCat = (product.category || '').toLowerCase().trim();
  const prodTitle = (product.title || product.name || '').toLowerCase();
  const prodDesc = (product.description || '').toLowerCase();
  const prodColl = normalizeCollection(product.collection || '');
  const rawColl = (product.collection || '').toLowerCase().trim();

  // Parse multi-collection assignments
  const productCollections: string[] = [];
  if (Array.isArray(product.collections)) {
    product.collections.forEach((c: any) => {
      if (typeof c === 'string' && c) {
        productCollections.push(normalizeCollection(c), normalizeSlug(c));
      }
    });
  }
  if (typeof product.collection === 'string' && product.collection) {
    const splitColls = product.collection.split(',').map((s: string) => s.trim()).filter(Boolean);
    splitColls.forEach((c: string) => {
      productCollections.push(normalizeCollection(c), normalizeSlug(c));
    });
  }

  // Direct match on any assigned collection or category
  if (
    prodCat === target ||
    prodColl === target ||
    prodColl === targetNorm ||
    normalizeSlug(rawCat) === target ||
    normalizeSlug(rawColl) === target ||
    productCollections.includes(target) ||
    productCollections.includes(targetNorm)
  ) return true;

  // Collection specific text & metadata overrides
  if (target === 'korean-collections' || target === 'korean-collection') {
    return (
      productCollections.includes('korean-collections') ||
      prodColl === 'korean-collections' ||
      prodCat === 'korean-collections' ||
      rawCat.includes('korean') ||
      rawColl.includes('korean') ||
      prodTitle.includes('korean') ||
      prodDesc.includes('korean')
    );
  }

  if (target === 'trending-collections' || target === 'trending-collection') {
    return (
      productCollections.includes('trending-collections') ||
      prodColl === 'trending-collections' ||
      product.bestSeller ||
      product.featured ||
      product.trending ||
      product.label === 'HOT'
    );
  }

  if (target === 'deal-of-the-day') {
    return (
      productCollections.includes('deal-of-the-day') ||
      prodColl === 'deal-of-the-day' ||
      !!product.metadata?.dealOfDay ||
      !!product.dealOfDay ||
      !!product.deal_of_day
    );
  }

  if (target === 'new-arrivals' || target === 'new-arrival') {
    return (
      productCollections.includes('new-arrivals') ||
      prodColl === 'new-arrivals' ||
      !!product.isNew ||
      !!product.new_arrival ||
      product.label === 'NEW'
    );
  }

  if (target === 'best-sellers' || target === 'best-seller') {
    return (
      productCollections.includes('best-sellers') ||
      prodColl === 'best-sellers' ||
      !!product.bestSeller ||
      !!product.trending
    );
  }

  if (target === 'premium-collection' || target === 'premium-collections') {
    return (
      productCollections.includes('premium-collection') ||
      productCollections.includes('premium-collections') ||
      rawColl.includes('premium') ||
      prodTitle.includes('premium')
    );
  }

  if (target === 'featured-collection' || target === 'featured-collections') {
    return (
      productCollections.includes('featured-collection') ||
      productCollections.includes('featured-collections') ||
      !!product.metadata?.featured ||
      !!product.featured
    );
  }

  if (target === 'festive-collection' || target === 'festive-collections' || target === 'festival-collections') {
    return (
      productCollections.includes('festival-collections') ||
      productCollections.includes('festive-collection') ||
      prodColl === 'festival-collections' ||
      prodTitle.includes('festival') ||
      prodTitle.includes('festive') ||
      prodDesc.includes('festival')
    );
  }

  if (target === 'seasonal-collection' || target === 'seasonal-collections') {
    return (
      productCollections.includes('seasonal-collection') ||
      productCollections.includes('seasonal-collections') ||
      rawColl.includes('summer') ||
      rawColl.includes('winter') ||
      rawColl.includes('seasonal')
    );
  }

  if (target === 'baggy-pants') {
    return (
      productCollections.includes('baggy-pants') ||
      prodColl === 'baggy-pants' ||
      prodTitle.includes('baggy') ||
      prodDesc.includes('baggy')
    );
  }

  if (target === 'korean-trousers') {
    return (
      productCollections.includes('korean-trousers') ||
      prodColl === 'korean-trousers' ||
      prodCat === 'korean-trousers' ||
      (prodTitle.includes('korean') && (prodTitle.includes('trouser') || prodTitle.includes('pant') || prodTitle.includes('trousers') || prodTitle.includes('pants')))
    );
  }

  if (target === 'traditional-collections' || target === 'traditional-collection') {
    return (
      productCollections.includes('traditional-collections') ||
      productCollections.includes('traditional-collection') ||
      prodColl === 'traditional-collections' ||
      prodCat === 'traditional-collections' ||
      rawCat.includes('traditional') ||
      rawColl.includes('traditional') ||
      prodTitle.includes('traditional') ||
      prodTitle.includes('ethnic') ||
      prodDesc.includes('traditional') ||
      prodDesc.includes('ethnic')
    );
  }

  if (target === 'insta-viral-collections' || target === 'insta-viral-collection' || target === 'insta-viral') {
    return (
      productCollections.includes('insta-viral-collections') ||
      productCollections.includes('insta-viral-collection') ||
      productCollections.includes('insta-viral') ||
      prodColl === 'insta-viral-collections' ||
      prodColl === 'insta-viral' ||
      prodCat === 'insta-viral-collections' ||
      rawCat.includes('insta') ||
      rawColl.includes('insta') ||
      rawCat.includes('viral') ||
      rawColl.includes('viral') ||
      prodTitle.includes('insta') ||
      prodTitle.includes('viral') ||
      prodDesc.includes('insta') ||
      prodDesc.includes('viral') ||
      !!product.metadata?.instaViral ||
      !!product.isInstaViral ||
      !!product.instaViral
    );
  }

  if (target === 'festival-collections') {
    return (
      productCollections.includes('festival-collections') ||
      prodColl === 'festival-collections' ||
      prodTitle.includes('festival') ||
      prodDesc.includes('festival')
    );
  }

  if (target === 'combo-offers') {
    return (
      productCollections.includes('combo-offers') ||
      prodColl === 'combo-offers' ||
      prodTitle.includes('combo') ||
      prodTitle.includes('pack of') ||
      prodTitle.includes('bundle')
    );
  }

  if (target === 'festival-offers') {
    return (
      productCollections.includes('festival-offers') ||
      prodColl === 'festival-offers' ||
      (prodTitle.includes('festival') && (product.discountPercent && product.discountPercent > 20))
    );
  }

  if (target === 'weekend-offers') {
    return (
      productCollections.includes('weekend-offers') ||
      prodColl === 'weekend-offers' ||
      prodTitle.includes('weekend') ||
      prodDesc.includes('weekend')
    );
  }

  if (target === 'formal-combos') {
    return (
      productCollections.includes('formal-combos') ||
      prodColl === 'formal-combos' ||
      (prodTitle.includes('formal') && (prodTitle.includes('combo') || prodTitle.includes('pack') || prodTitle.includes('bundle')))
    );
  }

  // Synonym mappings for categories:
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
