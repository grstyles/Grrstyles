// app/page.tsx
import HomeClient from "./HomeClient";
import { repo } from "@/lib/repositories";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const [products, banners] = await Promise.all([
      repo.products.getAll(),
      repo.banners.getActive(),
    ]);
    return <HomeClient initialProducts={products} initialBanners={banners} />;
  } catch (error) {
    console.error("[Home] Error fetching data:", error);
    // Return with empty data instead of failing
    return <HomeClient initialProducts={[]} initialBanners={[]} />;
  }
}
