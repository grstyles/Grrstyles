"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoryImage, normalizeSlug } from "@/lib/utils/categoryImageMap";
import styles from "./MensCategoryCarousel.module.css";
 
const categories = [
  "Shirts",
  "Printed Shirts",
  "T-Shirts",
  "Jackets",
  "Night Tracks",
  "Accessories",
  "Formal Shirts",
  "Formal Pant",
  "Trousers",
  "Denim Jeans",
  "Shoes"
];
 
export default function MensCategoryCarousel() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Shop By Category</h2>
        <p className={styles.subtitle}>
          Discover premium menswear crafted for every occasion.
        </p>
      </div>
 
      <div className={styles.gridContainer}>
        {categories.map((cat, index) => {
          const slug = normalizeSlug(cat);
          const img = getCategoryImage(cat);
          const href = `/category/${slug}`;
          return (
            <Link
              key={slug}
              href={href}
              className={styles.card}
            >
              <div className={styles.imageContainer}>
                <Image
                  src={img}
                  alt={cat}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className={styles.image}
                  priority={index < 4}
                />
                <div className={styles.overlay} />
                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{cat}</h3>
                  <span className={styles.ctaButton}>
                    SHOP NOW <span className={styles.arrow}>→</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
