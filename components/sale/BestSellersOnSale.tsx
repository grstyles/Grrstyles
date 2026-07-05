"use client";
import React, { useState, useEffect } from "react";
import SaleProductGrid from "@/components/sale/SaleProductGrid";
import { Product } from "@/lib/data/products";
import { repo } from "@/lib/repositories";
import styles from "./BestSellersOnSale.module.css";

export default function BestSellersOnSale() {
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await repo.products.getAll();
        // Filter products that are best sellers and on sale
        const filtered = data.filter(
          (p) => (p.bestSeller || (p.rating && p.rating >= 4.6)) && (p.discountPercent || 0) >= 20
        );
        setProductsList(filtered);
      } catch (err) {
        console.error("Failed to load best sellers on sale", err);
      }
    }
    load();
  }, []);

  return (
    <section className={styles.section}>
      <SaleProductGrid
        title="Best Sellers On Sale"
        badge="#1 SELLING"
        products={productsList}
        filterDiscount={20}
        limit={4}
      />
    </section>
  );
}
