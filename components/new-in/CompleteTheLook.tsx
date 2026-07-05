import Link from 'next/link';
import styles from './CompleteTheLook.module.css';

export default function CompleteTheLook() {
  const looks = [
    {
      title: 'Casual Weekend',
      items: 'Linen Shirt + Chinos + Sneakers',
      image: 'https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Business Sharp',
      items: 'Blazer + Oxford Shirt + Watch',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop'
    },
    {
      title: 'Summer Evening',
      items: 'Polo + Shorts + Loafers',
      image: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=800&auto=format&fit=crop'
    }
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Complete The Look</h2>
          <p className={styles.subtitle}>Curated outfits for every occasion.</p>
        </div>

        <div className={styles.grid}>
          {looks.map((look, idx) => (
            <div key={idx} className={styles.lookCard}>
              <div className={styles.imageWrapper}>
                <img src={look.image} alt={look.title} className={styles.image} />
                <div className={styles.overlay}>
                  <Link href="/collections/looks" className={styles.btn}>
                    Shop The Look
                  </Link>
                </div>
              </div>
              <div className={styles.content}>
                <h3 className={styles.lookTitle}>{look.title}</h3>
                <p className={styles.lookItems}>{look.items}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
