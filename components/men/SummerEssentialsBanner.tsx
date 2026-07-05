import Link from 'next/link';
import styles from './SummerEssentialsBanner.module.css';

export default function SummerEssentialsBanner() {
  return (
    <section className={styles.section}>
      <div className={styles.background}>
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.content}>
        <p className={styles.eyebrow}>UP TO 40% OFF</p>
        <h2 className={styles.title}>Summer Essentials</h2>
        <p className={styles.subtitle}>
          Upgrade your wardrobe with premium summer styles crafted for breathability and elegance.
        </p>
        <Link href="/collections/summer" className={styles.btn}>
          Shop Collection
        </Link>
      </div>
    </section>
  );
}
