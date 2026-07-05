"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './FlashSaleBanner.module.css';

// Simple hook for countdown to a fixed future date (e.g., end of sale)
function useSaleCountdown(endDate: Date) {
  const calculate = () => {
    const diff = endDate.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calculate);

  useEffect(() => {
    const interval = setInterval(() => setTime(calculate()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time;
}

export default function FlashSaleBanner() {
  // For demo, sale ends in 3 days from now
  const end = new Date();
  end.setDate(end.getDate() + 3);
  const { days, hours, minutes, seconds } = useSaleCountdown(end);

  return (
    <section className={styles.banner}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <h2 className={styles.title}>Flash Sale</h2>
        <p className={styles.subtitle}>Limited time offers – grab them before they disappear!</p>
        <div className={styles.timer}>
          {days}d {hours}h {minutes}m {seconds}s
        </div>
        <button className={styles.cta}>Shop Flash Deals</button>
      </div>
      <Image src="/images/flash-sale-bg.jpg" alt="Flash Sale" fill className={styles.bgImage} />
    </section>
  );
}
