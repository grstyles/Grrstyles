"use client";
import React from "react";
import { motion } from "framer-motion";
import styles from "./ShopByDiscount.module.css";

interface DiscountTier {
  label: string;
  range: string;
  bgColor: string; // Tailwind color class e.g., 'bg-[#f5f5f5]'
}

const tiers: DiscountTier[] = [
  { label: "Under 20% Off", range: "0% – 20%", bgColor: "bg-[#f9f9f9]" },
  { label: "20% – 40% Off", range: "20% – 40%", bgColor: "bg-[#f3f3f3]" },
  { label: "40% – 60% Off", range: "40% – 60%", bgColor: "bg-[#ececec]" },
  { label: "60% – 70% Off", range: "60% – 70%", bgColor: "bg-[#e5e5e5]" },
];

export default function ShopByDiscount() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Shop by Discount</h2>
      <div className={styles.grid}>
        {tiers.map((tier, idx) => (
          <motion.div
            key={idx}
            className={`${styles.card} ${tier.bgColor}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: idx * 0.15 }}
          >
            <p className={styles.label}>{tier.label}</p>
            <p className={styles.range}>{tier.range}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
