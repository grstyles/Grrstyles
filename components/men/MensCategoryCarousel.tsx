"use client";

import React, { useState, useEffect } from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";
import { repo } from "@/lib/repositories";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export default function MensCategoryCarousel() {
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);

  useEffect(() => {
    const load = () => repo.categoryCarousel.getActive().then(setCategories);
    load();

    window.addEventListener('category_carousel_updated', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('category_carousel_updated', load);
      window.removeEventListener('storage', load);
    };
  }, []);

  return (
    <PremiumCategoryCarousel 
      categories={categories}
      title="Shop By Category"
      subtitle="Discover premium menswear crafted for every occasion."
    />
  );
}
