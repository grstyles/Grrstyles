import Link from "next/link";
import styles from "./MensCompleteTheLook.module.css";

export default function MensCompleteTheLook() {
  const looks = [
    {
      title: "Casual Weekend",
      items: "Shirt + Jeans + Sneakers",
      image:
        "https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=800&auto=format&fit=crop",
      slug: "casual-weekend",
    },
    {
      title: "Office Ready",
      items: "Blazer + Trousers + Watch",
      image:
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop",
      slug: "office-ready",
    },
    {
      title: "Summer Vibes",
      items: "Linen Shirt + Shorts + Loafers",
      image:
        "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=800&auto=format&fit=crop",
      slug: "summer-vibes",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Complete The Look</h2>
          <p className={styles.subtitle}>
            Handpicked outfit bundles for the modern man.
          </p>
        </div>

        <div className={styles.grid}>
          {looks.map((look, idx) => (
            <div key={idx} className={styles.lookCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={look.image}
                  alt={look.title}
                  className={styles.image}
                  loading="lazy"
                />
                <div className={styles.overlay}>
                  <Link href={`/combo/${look.slug}`} className={styles.btn}>
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
