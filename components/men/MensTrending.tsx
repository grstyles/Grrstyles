"use client";
import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './MensTrending.module.css';

const trendingCategories = [
  'Linen Collection',
  'Smart Casual',
  'Formal Wear',
  'Premium Denim',
  'Luxury Footwear',
  'Accessories'
];

export default function MensTrending() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!scrollRef.current) return;
      
      const totalWidth = scrollRef.current.scrollWidth;
      
      const tl = gsap.timeline({ repeat: -1, paused: false });
      
      tl.to(scrollRef.current, {
        x: -totalWidth / 2,
        duration: 35,
        ease: 'none',
      });

      scrollRef.current.addEventListener('mouseenter', () => tl.pause());
      scrollRef.current.addEventListener('mouseleave', () => tl.play());
      
    }, scrollRef);
    return () => ctx.revert();
  }, []);

  // Duplicate for seamless scroll
  const displayItems = [...trendingCategories, ...trendingCategories];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.label}>TRENDING NOW</div>
        <div className={styles.carouselContainer} ref={scrollRef}>
          {displayItems.map((item, i) => (
            <div key={i} className={styles.item}>
              {item}
              <span className={styles.separator}>✦</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
