import { repo } from "@/lib/repositories";
import NewInClient from "@/app/new-in/NewInClient";

export const metadata = {
  title: "NEW IN - Latest Arrivals | GR STYLES",
  description: "Discover the newest premium fashion essentials crafted for confidence and everyday luxury."
};

export const dynamic = 'force-dynamic';

export default async function NewInPage() {
  const allProducts = await repo.products.getAll();
  const newProducts = allProducts.filter((p) => p.isNew || (p as any).newArrival || p.label === 'NEW');
  return <NewInClient initialProducts={newProducts} />;
}
