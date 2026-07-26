"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './FlashSaleBanner.module.css';

// Hook for countdown with mount check to prevent SSR hydration mismatches
function useSaleCountdown() {
  const [isMounted, setIsMounted] = useState(false);
  const [time, setTime] = useState({ days: 3, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setIsMounted(true);

    const end = new Date();
    end.setDate(end.getDate() + 3);

    const calculate = () => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTime(calculate());
    const interval = setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(interval);
  }, []);

  return { ...time, isMounted };
}

export default function FlashSaleBanner() {
  const { days, hours, minutes, seconds, isMounted } = useSaleCountdown();

  return (
    <section className={styles.banner}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h2 className={styles.title}>Flash Sale</h2>
        <p className={styles.subtitle}>Limited time offers – grab them before they disappear!</p>
        <div className={styles.timer} suppressHydrationWarning>
          {isMounted ? `${days}d ${hours}h ${minutes}m ${seconds}s` : '3d 0h 0m 0s'}
        </div>
        <button className={styles.cta}>Shop Flash Deals</button>
      </div>
      <Image src="/images/flash-sale-bg.jpg" alt="Flash Sale" fill className={styles.bgImage} />
    </section>
  );
}
