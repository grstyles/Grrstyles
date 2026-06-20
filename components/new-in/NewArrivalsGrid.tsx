"use client";
import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PremiumProductCard from "./PremiumProductCard";
import styles from "./NewArrivalsGrid.module.css";
import { products } from "@/lib/data/products"; // Assuming we have products data

// Register ScrollTrigger
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function NewArrivalsGrid() {
  const [activeCategory, setActiveCategory] = useState("All");
  const gridRef = useRef<HTMLDivElement>(null);

  const categories = [
    "All",
    "Shirts",
    "Trousers",
    "Jackets",
    "Footwear",
    "Accessories",
  ];

  useEffect(() => {
    // Simple stagger animation on mount or filter change
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".product-card-anim",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
          },
        },
      );
    }, gridRef);

    return () => ctx.revert();
  }, [activeCategory]);

  // Use only first 8 products for demo, filter if needed
  const displayProducts =
    activeCategory === "All"
      ? products.slice(0, 8)
      : products
          .filter(
            (p) => p.category.toLowerCase() === activeCategory.toLowerCase(),
          )
          .slice(0, 8);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>New Arrivals</h2>
          <p className={styles.subtitle}>Fresh styles just dropped.</p>
        </div>

        {/* Sticky Filter Bar */}
        <div className={styles.filterBar}>
          <div className={styles.categories}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`${styles.filterBtn} ${activeCategory === cat ? styles.activeFilter : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className={styles.sortOptions}>
            <select className={styles.sortSelect} aria-label="Sort products">
              <option>Sort by: Newest</option>
              <option>Price: High to Low</option>
              <option>Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className={styles.grid} ref={gridRef}>
          {displayProducts.map((product) => (
            <div key={product.id} className="product-card-anim">
              <PremiumProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
