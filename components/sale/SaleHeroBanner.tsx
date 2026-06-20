"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './SaleHeroBanner.module.css';

export default function SaleHeroBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // 48 hours from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <section className={styles.heroSection}>
      <div className={styles.background}>
        <div className={styles.overlay}></div>
      </div>

      <div className={styles.content}>
        <span className={styles.label}>LIMITED TIME OFFER</span>
        <h1 className={styles.title}>SEASON SALE</h1>
        <p className={styles.subtitle}>
          Save up to 70% on premium menswear collections.
        </p>

        {/* Countdown Timer */}
        <div className={styles.timer}>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Days</span>
          </div>
          <span className={styles.separator}>•</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Hours</span>
          </div>
          <span className={styles.separator}>•</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Minutes</span>
          </div>
          <span className={styles.separator}>•</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className={styles.timeLabel}>Seconds</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link href="#collecctions" className={styles.primaryBtn}>Shop Sale</Link>
          <Link href="#mens" className={styles.secondaryBtn}>Explore Deals</Link>
        </div>
      </div>
    </section>
  );
}
