import SaleClient from './SaleClient';
import { repo } from '@/lib/repositories';

export const metadata = {
  title: 'SEASON SALE - Up to 70% OFF | GR STYLES.',
  description: 'Shop the biggest seasonal sale event. Premium menswear collections at exclusive discounts.',
};

export const dynamic = 'force-dynamic';

export default async function SalePage() {
  const products = await repo.products.getAll();
  return <SaleClient initialProducts={products} />;
}
