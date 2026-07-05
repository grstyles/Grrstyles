"use client";
import { useState, useEffect } from 'react';
import styles from './CountdownBanner.module.css';

export default function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // Set target date 3 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    
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
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.title}>Next Drop In</h2>
        <div className={styles.timer}>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span className={styles.label}>Days</span>
          </div>
          <span className={styles.separator}>:</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.label}>Hours</span>
          </div>
          <span className={styles.separator}>:</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.label}>Minutes</span>
          </div>
          <span className={styles.separator}>:</span>
          <div className={styles.timeBlock}>
            <span className={styles.number}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className={styles.label}>Seconds</span>
          </div>
        </div>
      </div>
    </section>
  );
}
