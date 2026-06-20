"use client";
import styles from './LuxuryNewsletter.module.css';

export default function LuxuryNewsletter() {
  return (
    <section className={styles.section}>
      <div className={styles.background}></div>
      <div className={styles.container}>
        <div className={styles.glassCard}>
          <h2 className={styles.title}>Stay In Style</h2>
          <p className={styles.subtitle}>
            Get exclusive access to new arrivals, fashion tips, and member-only offers.
          </p>
          <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className={styles.input} 
              required
            />
            <button type="submit" className={styles.btn}>
              Subscribe
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
