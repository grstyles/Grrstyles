import HomeClient from './HomeClient';
import { repo } from '@/lib/repositories';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [products, banners] = await Promise.all([
    repo.products.getAll(),
    repo.banners.getActive()
  ]);
  return <HomeClient initialProducts={products} initialBanners={banners} />;
}
