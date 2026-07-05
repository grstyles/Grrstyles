"use client";
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import PremiumProductCard from '../new-in/PremiumProductCard';
import styles from './MensProductGrid.module.css';

gsap.registerPlugin(ScrollTrigger);

interface MensProductGridProps {
  title: string;
  subtitle: string;
  products: any[];
  badge?: string;
}

export default function MensProductGrid({ title, subtitle, products, badge }: MensProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.mens-product-card', 
        { y: 50, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 0.8, 
          stagger: 0.1, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 80%',
          }
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [products]);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          {badge && <div className={styles.badge}>{badge}</div>}
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>

        <div className={styles.grid} ref={gridRef}>
          {products.map((product) => (
            <div key={product.id} className="mens-product-card">
              <PremiumProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
