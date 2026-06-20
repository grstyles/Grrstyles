import styles from "./StyleInspirationGallery.module.css";

export default function StyleInspirationGallery() {
  const images = [
    {
      src: "https://images.unsplash.com/photo-1616091216791-a0260c5248a8?q=80&w=800&auto=format&fit=crop",
      alt: "Style 1",
      size: "large",
    },
    {
      src: "https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=800&auto=format&fit=crop",
      alt: "Style 2",
      size: "small",
    },
    {
      src: "https://images.unsplash.com/photo-1590424686001-f2f64f526b71?q=80&w=800&auto=format&fit=crop",
      alt: "Style 3",
      size: "medium",
    },
    {
      src: "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=800&auto=format&fit=crop",
      alt: "Style 4",
      size: "medium",
    },
    {
      src: "https://images.unsplash.com/photo-1484515991647-c5760fcecfc7?q=80&w=800&auto=format&fit=crop",
      alt: "Style 5",
      size: "small",
    },
  ];

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Style Inspiration</h2>
        <p className={styles.subtitle}>@grstyles</p>
      </div>

      <div className={styles.gallery}>
        {images.map((img, idx) => (
          <div
            key={idx}
            className={`${styles.galleryItem} ${styles[img.size]}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className={styles.image}
              loading="lazy"
            />
            <div className={styles.overlay}>
              <span className={styles.icon}>Shop The Look</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
