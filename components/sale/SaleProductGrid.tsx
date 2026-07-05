// components/sale/SaleProductGrid.tsx
'use client';

import SaleProductCard, { SaleProduct } from './SaleProductCard';
import { Product } from '@/lib/data/products';

interface SaleProductGridProps {
  products?: (Product | SaleProduct)[];
  title?: string;
  subtitle?: string;
  badge?: string;
  filterDiscount?: number;
  limit?: number;
}

export default function SaleProductGrid({ 
  products,
  title = 'Sale Collection',
  subtitle = 'Limited time offers on premium menswear',
  badge,
  filterDiscount = 0,
  limit
}: SaleProductGridProps) {
  // If products is not passed, default to empty array
  const baseProducts = products || [];

  // Filter products by discount percent
  let filtered = baseProducts.filter(p => {
    const discount = p.discountPercent || 0;
    return discount >= filterDiscount;
  });

  // Limit items if specified
  if (limit) {
    filtered = filtered.slice(0, limit);
  }

  // Map to the required SaleProduct shape for SaleProductCard
  const validProducts: SaleProduct[] = filtered.map(p => {
    // If it's already a SaleProduct (has image property directly as a string)
    if ('image' in p && typeof p.image === 'string') {
      return p as SaleProduct;
    }
    
    // Otherwise it's a standard Product
    const prod = p as Product;
    return {
      id: prod.id,
      slug: prod.slug,
      title: prod.title || prod.name || '',
      brand: prod.brand || 'GR STYLES',
      price: prod.price || prod.mrpPrice || 0,
      discountedPrice: prod.discountedPrice || prod.sellingPrice || 0,
      discountPercent: prod.discountPercent || 0,
      image: prod.images?.[0] || '',
    };
  });

  if (validProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products available</p>
      </div>
    );
  }

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            {badge && (
              <span className="bg-black text-white text-[10px] tracking-wider font-semibold px-2.5 py-1 rounded uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {validProducts.map((product) => (
            <SaleProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}