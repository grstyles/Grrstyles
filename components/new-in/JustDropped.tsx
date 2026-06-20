import Link from 'next/link';
import styles from './JustDropped.module.css';

export default function JustDropped() {
  return (
    <section className={styles.section}>
      <div className={styles.background}>
        <div className={styles.overlay}></div>
      </div>
      <div className={styles.content}>
        <h2 className={styles.title}>JUST DROPPED</h2>
        <p className={styles.subtitle}>
          Limited pieces available.<br/>Get them before they're gone.
        </p>
        <Link href="/men" className={styles.btn}>
          Shop Now
        </Link>
      </div>
    </section>
  );
}