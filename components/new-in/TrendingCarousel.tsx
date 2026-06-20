"use client";
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './TrendingCarousel.module.css';

const categories = [
  'Linen Collection',
  'Summer Essentials',
  'Premium Shirts',
  'Formal Wear',
  'Denim Collection',
  'New Footwear',
  'Luxury Accessories',
  // Duplicate for seamless scroll
  'Linen Collection',
  'Summer Essentials',
  'Premium Shirts',
  'Formal Wear',
  'Denim Collection',
  'New Footwear',
  'Luxury Accessories',
];

export default function TrendingCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!scrollRef.current) return;
      const container = scrollRef.current;
      
      const totalWidth = container.scrollWidth;
      
      gsap.set(container, { x: 0 });
      const tl = gsap.timeline({ repeat: -1, paused: false });
      
      // Assume half the width since we duplicated items
      tl.to(container, {
        x: -totalWidth / 2,
        duration: 30, // Adjust speed
        ease: 'none',
      });

      container.addEventListener('mouseenter', () => tl.pause());
      container.addEventListener('mouseleave', () => tl.play());
      
    }, scrollRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className={styles.carouselSection}>
      <div className={styles.eyebrow}>TRENDING NOW</div>
      <div className={styles.carouselContainer} ref={scrollRef}>
        {categories.map((cat, i) => (
          <div key={i} className={styles.carouselItem}>
            {cat}
          </div>
        ))}
      </div>
    </section>
  );
}
