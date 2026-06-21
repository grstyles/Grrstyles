"use client";
 
import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCategoryImage, normalizeSlug } from "@/lib/utils/categoryImageMap";
import styles from "./CategoriesSection.module.css";
 
const categories = [
  "Shirts",
  "T-Shirts",
  "Trousers",
  "Jackets",
  "Hoodies",
  "Jeans",
  "Sweatshirts"
];
 
export default function CategoriesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
 
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Shop by Category</h2>
          <p className={styles.subtitle}>
            Discover premium essentials crafted for modern men.
          </p>
        </div>
 
        <div className={styles.scrollWrapper} ref={scrollRef}>
          <div className={styles.cards}>
            {categories.map((category, idx) => {
              const slug = normalizeSlug(category);
              const img = getCategoryImage(category);
              return (
                <Link
                  key={`${slug}-${idx}`}
                  href={`/category/${slug}`}
                  className={styles.cardLink}
                >
                  <div className={styles.card}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={img}
                        alt={category}
                        fill
                        sizes="(max-width: 768px) 150px, 200px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <h3 className={styles.name}>{category}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
