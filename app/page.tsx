import HomeClient from './HomeClient';
import { repo } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await repo.products.getAll();
  return <HomeClient initialProducts={products} />;
}
