"use client";

import React, { useState, useEffect, useRef } from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";
import { repo } from "@/lib/repositories";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export default function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const reqSeqRef = useRef(0);

  useEffect(() => {
    const load = async (isInitial = false) => {
      const currentSeq = ++reqSeqRef.current;
      if (isInitial) setLoading(true);
      try {
        const data = await repo.categoryCarousel.getActive();
        if (reqSeqRef.current === currentSeq) {
          setCategories(data);
        }
      } catch (err) {
        console.warn('Failed to load categories:', err);
      } finally {
        if (reqSeqRef.current === currentSeq) {
          setLoading(false);
        }
      }
    };

    load(true);

    const handleUpdate = () => load(false);

    window.addEventListener("category_carousel_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("category_carousel_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <PremiumCategoryCarousel
      categories={categories}
      isLoading={loading}
      title="Shop by Category"
      subtitle="Discover premium essentials crafted for modern men."
    />
  );
}