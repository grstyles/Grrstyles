"use client";
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { repo } from '@/lib/repositories';
import styles from './CollectionHeader.module.css';

export default function CollectionHeader() {
  const [heroImage, setHeroImage] = useState<string | null>(null);

  useEffect(() => {
    repo.navigation.getByPage('collections').then((data) => {
      if (data?.imageUrl) {
        setHeroImage(data.imageUrl);
      }
    }).catch(err => console.error('Failed to load collections hero image', err));
  }, []);

  return (
    <section
      className={styles.headerSection}
      style={heroImage ? { backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.7), rgba(17, 17, 17, 0.8)), url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
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