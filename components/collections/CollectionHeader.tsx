"use client";
import { Search } from 'lucide-react';
import styles from './CollectionHeader.module.css';

export default function CollectionHeader() {
  return (
    <section className={styles.headerSection}>
      <div className={styles.container}>
        <span className={styles.label}>SHOP</span>
        <h1 className={styles.title}>The Collection</h1>
        <p className={styles.subtitle}>
          Browse our complete menswear collection and discover premium styles for every occasion.
        </p>
        
        <div className={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="Search products, brands, or categories..." 
            className={styles.searchInput}
            aria-label="Search collection"
          />
          <button className={styles.searchButton} aria-label="Search">
            <Search size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}