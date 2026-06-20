"use client";
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PremiumProductCard from '../new-in/PremiumProductCard';
import styles from './CollectionGrid.module.css';

gsap.registerPlugin(ScrollTrigger);

interface CollectionGridProps {
  products: any[];
}

export default function CollectionGrid({ products }: CollectionGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.product-anim', 
        { y: 40, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
          }
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [products]);

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <span className={styles.count}>Showing: {products.length} Products</span>
        <div className={styles.sortContainer}>
          <select className={styles.sortSelect} aria-label="Sort products">
            <option>Sort by: Featured</option>
            <option>Newest Arrivals</option>
            <option>Price: High to Low</option>
            <option>Price: Low to High</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {products.length > 0 ? (
        <div className={styles.grid} ref={gridRef}>
          {products.map((product) => (
            <div key={product.id} className="product-anim">
              <PremiumProductCard product={product} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No products found</h3>
          <p className={styles.emptyText}>Try adjusting your filters or search criteria.</p>
        </div>
      )}
    </div>
  );
}
