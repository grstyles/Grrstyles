"use client";
import React, { useEffect, useRef, useState } from 'react';
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
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Don't run if not mounted, no products, or no grid ref
    if (!isMounted || !gridRef.current || products.length === 0) return;

    // Use a small delay to ensure DOM is fully painted
    const timer = setTimeout(() => {
      if (!gridRef.current) return;

      // Get all product elements within the grid
      const elements = gridRef.current.querySelectorAll('.product-anim');
      
      if (elements.length === 0) {
        console.warn('No .product-anim elements found');
        return;
      }

      // Convert NodeList to array for GSAP
      const elems = Array.from(elements) as HTMLElement[];

      // Create a GSAP context for proper cleanup
      const ctx = gsap.context(() => {
        // Set initial state
        gsap.set(elems, { 
          y: 40, 
          opacity: 0 
        });

        // Create animation with ScrollTrigger
        gsap.to(elems, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      }, gridRef.current);

      return () => {
        ctx.revert();
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => {
      clearTimeout(timer);
    };
  }, [products, isMounted]);

  // Cleanup ScrollTriggers on unmount
  useEffect(() => {
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

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