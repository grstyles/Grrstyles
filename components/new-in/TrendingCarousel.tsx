"use client";
import { useDraggableScroll } from '@/hooks/useDraggableScroll';
import styles from './TrendingCarousel.module.css';

const categories = [
  'Linen Collection',
  'Summer Essentials',
  'Premium Shirts',
  'Formal Wear',
  'Denim Collection',
  'New Footwear',
  'Luxury Accessories',
];

export default function TrendingCarousel() {
  const scrollRef = useDraggableScroll<HTMLDivElement>();

  return (
    <section className={styles.carouselSection}>
      <div className={styles.eyebrow}>TRENDING NOW</div>
      <div 
        className={`${styles.carouselContainer} flex overflow-x-auto snap-x snap-mandatory scrollbar-none`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
        ref={scrollRef}
      >
        {categories.map((cat, i) => (
          <div key={i} className={`${styles.carouselItem} shrink-0 snap-start select-none whitespace-nowrap px-4 py-2 border rounded-full mr-4 bg-white hover:bg-gray-50 transition-colors`}>
            {cat}
          </div>
        ))}
      </div>
    </section>
  );
}
