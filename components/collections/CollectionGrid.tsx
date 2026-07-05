"use client";
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PremiumProductCard from '../new-in/PremiumProductCard';
import styles from './CollectionGrid.module.css';

// Only register plugin on client side
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface CollectionGridProps {
  products: any[];
}

export default function CollectionGrid({ products }: CollectionGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [animationsInitialized, setAnimationsInitialized] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize animations
  useEffect(() => {
    // Only run if:
    // 1. Component is mounted
    // 2. There are products
    // 3. Grid ref exists
    // 4. Animations not already initialized
    if (!isMounted || !products.length || !gridRef.current || animationsInitialized) {
      return;
    }

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      // Find all product elements
      const productElements = gridRef.current?.querySelectorAll('.product-anim');
      
      // Only proceed if elements exist
      if (!productElements || productElements.length === 0) {
        console.warn('No .product-anim elements found to animate');
        return;
      }

      // Kill any existing animations to prevent conflicts
      gsap.killTweensOf(productElements);
      
      // Kill any existing ScrollTriggers that might conflict
      ScrollTrigger.getAll().forEach(st => {
        if (st.vars && st.vars.trigger === gridRef.current) {
          st.kill();
        }
      });

      // Create GSAP context for proper cleanup
      const ctx = gsap.context(() => {
        // Set initial state first
        gsap.set(productElements, {
          y: 40,
          opacity: 0,
        });

        // Animate in
        gsap.to(productElements, {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            invalidateOnRefresh: true,
          }
        });
      }, gridRef);

      setAnimationsInitialized(true);

      // Cleanup
      return () => {
        ctx.revert();
        // Don't kill all ScrollTriggers here as it might affect other components
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isMounted, products, animationsInitialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Kill any ScrollTriggers created by this component
      if (gridRef.current) {
        ScrollTrigger.getAll().forEach(st => {
          if (st.vars && st.vars.trigger === gridRef.current) {
            st.kill();
          }
        });
      }
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
          {products.map((product, index) => (
            <div 
              key={product.id} 
              className="product-anim"
              style={{
                opacity: 0,
                transform: 'translateY(40px)'
              }}
            >
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