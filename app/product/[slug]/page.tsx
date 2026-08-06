import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { productService } from '@/services/productService';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    return {
      title: 'Product Not Found | GR STYLES',
      description: 'The requested product could not be found.',
    };
  }

  try {
    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return {
        title: 'Product Not Found | GR STYLES',
        description: 'The requested product could not be found.',
      };
    }

    const title = `${product.title} | ${product.brand || 'GR STYLES'}`;
    const description =
      product.description ||
      `Shop ${product.title} at ${product.brand || 'GR STYLES'}. High quality fashion apparel with fast shipping.`;
    const imageUrl = product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: imageUrl ? [{ url: imageUrl }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata for product page:', error);
    return {
      title: 'Product Details | GR STYLES',
      description: 'Explore premium fashion products at GR STYLES.',
    };
  }
}

export default async function ProductDetailsPage({ params }: ProductPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    notFound();
  }

  let product = null;
  let initialRelated: any[] = [];

  try {
    product = await productService.getProductBySlug(slug);
    if (product) {
      initialRelated = await productService.getRelatedProducts(slug);
    }
  } catch (error) {
    console.error(`Error loading product with slug "${slug}":`, error);
  }

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailsClient
      product={product}
      initialRelatedProducts={initialRelated}
      slug={slug}
    />
  );
}