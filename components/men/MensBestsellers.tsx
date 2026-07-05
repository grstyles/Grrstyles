import MensProductGrid from './MensProductGrid';
import { products } from '@/lib/data/products';

export default function MensBestsellers() {
  // Use a different slice of products for demo
  const bestsellers = products.slice().reverse().slice(0, 4);

  return (
    <MensProductGrid 
      title="Bestsellers" 
      subtitle="Our most loved pieces this season." 
      products={bestsellers} 
      badge="#1 Selling"
    />
  );
}
