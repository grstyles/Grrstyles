"use client";
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./MensCategoryCarousel.module.css";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    name: "Shirts",
    slug: "shirts",
    img: "/images/categories/printed_shirts.png",
  },
  {
    name: "T-Shirts",
    slug: "t-shirts",
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Polo Shirts",
    slug: "polo-shirts",
    img: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Jeans",
    slug: "jeans",
    img: "/images/categories/denim_jeans.png",
  },
  {
    name: "Trousers",
    slug: "trousers",
    img: "https://images.unsplash.com/photo-1473617231723-2a5ebf1379b7?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Blazers",
    slug: "blazers",
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Jackets",
    slug: "jackets",
    img: "/images/categories/jackets.png",
  },
  {
    name: "Hoodies",
    slug: "hoodies",
    img: "https://images.unsplash.com/photo-1556821552-5ff63b1b5786?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Sneakers",
    slug: "sneakers",
    img: "/images/categories/shoes.png",
  },
  {
    name: "Watches",
    slug: "watches",
    img: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Accessories",
    slug: "accessories",
    img: "/images/categories/accessories.png",
  },
  {
    name: "Formal Wear",
    slug: "formal",
    img: "https://images.unsplash.com/photo-1606505056413-018a46fd84d0?q=80&w=300&auto=format&fit=crop",
  },
];

export default function MensCategoryCarousel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!scrollRef.current) return;
      const totalWidth = scrollRef.current.scrollWidth;

      const tl = gsap.timeline({ repeat: -1, paused: false });

      tl.to(scrollRef.current, {
        x: -totalWidth / 2, // Scroll half since we will duplicate
        duration: 40,
        ease: "none",
      });

      scrollRef.current.addEventListener("mouseenter", () => tl.pause());
      scrollRef.current.addEventListener("mouseleave", () => tl.play());

      // Simple drag functionality
      let isDown = false;
      let startX: number;
      let currentX: number;
      const el = scrollRef.current;

      el.addEventListener("pointerdown", (e) => {
        isDown = true;
        tl.pause();
        startX = e.pageX - Number(gsap.getProperty(el, "x"));
        el.setPointerCapture(e.pointerId);
      });

      el.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        currentX = e.pageX - startX;
        gsap.set(el, { x: currentX });
      });

      el.addEventListener("pointerup", () => {
        isDown = false;
        tl.play();
      });

      el.addEventListener("pointerleave", () => {
        isDown = false;
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Duplicate for seamless infinite loop
  const displayCategories = [...categories, ...categories];

  return (
    <section className={styles.section} ref={containerRef}>
      <div className={styles.header}>
        <h2 className={styles.title}>Shop By Category</h2>
        <p className={styles.subtitle}>
          Discover premium menswear crafted for every occasion.
        </p>
      </div>

      <div className={styles.carouselWrapper}>
        <div className={styles.carouselTrack} ref={scrollRef}>
          {displayCategories.map((cat, index) => (
            <Link
              key={`${cat.slug}-${index}`}
              href={`/category/${cat.slug}`}
              className={styles.card}
            >
              <div className={styles.imageContainer}>
                <img
                  src={cat.img}
                  alt={cat.name}
                  className={styles.image}
                  loading="lazy"
                />
              </div>
              <h3 className={styles.cardTitle}>{cat.name}</h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
