import MensClient from './MensClient';
import { repo } from '@/lib/repositories';

export const metadata = {
  title: 'Men\'s Collection - Premium Luxury | GR STYLES.',
  description: 'Elevate your everyday style with premium essentials designed for confidence, comfort, and sophistication.',
};

export const dynamic = 'force-dynamic';

export default async function MensPage() {
  const products = await repo.products.getAll();
  return <MensClient initialProducts={products} />;
}
