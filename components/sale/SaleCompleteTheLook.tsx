"use client";
import React from "react";
import SaleProductCard from "./SaleProductCard";
import styles from "./SaleCompleteTheLook.module.css";

const products = [
  {
    id: '1',
    slug: 'slim-fit-blazer',
    title: 'Slim Fit Blazer',
    brand: 'GR STYLES',
    price: 1390,
    discountedPrice: 1390,
    discountPercent: 0,
    image: '/images/blazer.jpg',
  },
  {
    id: '2',
    slug: 'leather-oxford-shoes',
    title: 'Leather Oxford Shoes',
    brand: 'GR STYLES',
    price: 1110,
    discountedPrice: 1110,
    discountPercent: 0,
    image: '/images/shoes.jpg',
  },
  {
    id: '3',
    slug: 'cashmere-scarf',
    title: 'Cashmere Scarf',
    brand: 'GR STYLES',
    price: 710,
    discountedPrice: 710,
    discountPercent: 0,
    image: '/images/scarf.jpg',
  },
  {
    id: '4',
    slug: 'stone-shaped-wide-leg-jeans',
    title: 'Stone Shaped Wide Leg Jeans',
    brand: 'DENIM ZONE',
    price: 2499,
    discountedPrice: 1999,
    discountPercent: 20,
    image: '/images/product1.jpg',
  },
  {
    id: '5',
    slug: 'bow-printed-jeans',
    title: 'Bow Printed Jeans with Stoned Belt',
    brand: 'DENIM ZONE',
    price: 1699,
    discountedPrice: 1299,
    discountPercent: 24,
    image: '/images/product2.jpg',
  },
];

export default function SaleCompleteTheLook() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Complete The Look</h2>
      <p className={styles.subtitle}>
        Curated selections to finish your outfit
      </p>
      <div className={styles.grid}>
        {products.map((product) => (
          <SaleProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
