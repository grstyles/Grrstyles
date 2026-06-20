import Link from "next/link";
import styles from "./EditorsPicks.module.css";

export default function EditorsPicks() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editor's Picks</h2>
          <p className={styles.subtitle}>Curated selections for the season.</p>
        </div>

        <div className={styles.grid}>
          {/* Main feature */}
          <div className={`${styles.card} ${styles.mainCard}`}>
            <div className={styles.imageWrapper}>
              <img
                src="https://images.unsplash.com/photo-1593032465175-481ac7f401a0?q=80&w=1000&auto=format&fit=crop"
                alt="The Linen Suit"
                className={styles.image}
              />
              <div className={styles.badge}>DESIGNER'S CHOICE</div>
            </div>
            <div className={styles.content}>
              <h3 className={styles.cardTitle}>The Summer Linen Suit</h3>
              <p className={styles.cardDesc}>
                A masterclass in relaxed tailoring. Perfect for summer weddings
                and garden parties.
              </p>
              <Link href="/product/linen-suit" className={styles.link}>
                Shop Collection
              </Link>
            </div>
          </div>

          {/* Secondary features */}
          <div className={styles.sideCards}>
            <div className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1506645292803-579c17d4ba6a?q=80&w=800&auto=format&fit=crop"
                  alt="Premium Watch"
                  className={styles.image}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>Timepieces</h3>
                <p className={styles.cardDesc}>Elevate any look.</p>
                <Link href="/collections/watches" className={styles.link}>
                  Shop Watches
                </Link>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=800&auto=format&fit=crop"
                  alt="Leather Loafers"
                  className={styles.image}
                />
              </div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>Leather Loafers</h3>
                <p className={styles.cardDesc}>
                  The ultimate smart-casual staple.
                </p>
                <Link href="/collections/footwear" className={styles.link}>
                  Shop Shoes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
