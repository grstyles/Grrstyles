"use client";
import styles from './FooterCTA.module.css';

export default function FooterCTA() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.glassCard}>
          <div className={styles.content}>
            <h2 className={styles.title}>Stay Ahead of Fashion</h2>
            <p className={styles.subtitle}>
              Subscribe to get early access to every new drop.
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
      </div>
    </section>
  );
}
