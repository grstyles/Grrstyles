import MensProductGrid from './MensProductGrid';
import { products } from '@/lib/data/products';

export default function MensFeaturedProducts() {
  // Use first 8 products for demo
  const featuredProducts = products.slice(0, 8);

  return (
    <MensProductGrid 
      title="Featured Products" 
      subtitle="Handpicked essentials for modern men." 
      products={featuredProducts} 
    />
  );
}
