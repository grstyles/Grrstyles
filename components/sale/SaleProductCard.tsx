"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from './SaleProductCard.module.css';

export interface SaleProduct {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  discountedPrice: number;
  discountPercent: number;
  image: string;
}

export default function SaleProductCard({ product }: { product: SaleProduct }) {
  return (
    <Link href={`/product/${product.slug}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image src={product.image} alt={product.title} fill className={styles.image} priority />
        {product.discountPercent > 0 && (
          <span className={styles.badge}>-{product.discountPercent}%</span>
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{product.title}</h3>
        <p className={styles.brand}>{product.brand}</p>
        <p className={styles.price}>₹{product.discountedPrice.toLocaleString()}</p>
        {product.discountPercent > 0 && (
          <span className={styles.original}>₹{product.price.toLocaleString()}</span>
        )}
      </div>
    </Link>
  );
}
