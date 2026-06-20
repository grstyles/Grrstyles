"use client";

import React, { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./CategoriesSection.module.css";

interface Category {
  name: string;
  slug: string;
  image: string;
}

const categories: Category[] = [
  { name: "Shirts", slug: "shirts", image: "/images/shop1.jpeg" },
  { name: "T-Shirts", slug: "t-shirts", image: "/images/shop2.jpeg" },
  { name: "Trousers", slug: "trousers", image: "/images/shop3.jpeg" },
  { name: "Jackets", slug: "jackets", image: "/images/shop4.jpeg" },
  { name: "Hoodies", slug: "hoodies", image: "/images/shop5.jpg" },
  { name: "Jeans", slug: "jeans", image: "/images/shop6.jpg" },
  { name: "Sweatshirts", slug: "sweatshirts", image: "/images/shop7.jpg" },
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
            {categories.map((category, idx) => (
              <Link
                key={`${category.slug}-${idx}`}
                href={`/category/${category.slug}`}
                className={styles.cardLink}
              >
                <div className={styles.card}>
                  <div className={styles.imageContainer}>
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 150px, 200px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <h3 className={styles.name}>{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
