"use client";

import styles from "./SaleCategoryTabs.module.css";

const categories = [
  "All Sale",
  "Shirts",
  "T-Shirts",
  "Jeans",
  "Trousers",
  "Blazers",
  "Jackets",
  "Footwear",
  "Accessories",
];

interface SaleCategoryTabsProps {
  active: string;
  setActive: (category: string) => void;
}

export default function SaleCategoryTabs({ active, setActive }: SaleCategoryTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Sale categories">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`${styles.tab} ${active === cat ? styles.active : ''}`}
          onClick={() => setActive(cat)}
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}
