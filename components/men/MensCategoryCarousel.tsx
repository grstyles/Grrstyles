"use client";

import React, { useState, useEffect } from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";
import { repo } from "@/lib/repositories";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export default function MensCategoryCarousel() {
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);

  useEffect(() => {
    // Optionally, if men's categories should be filtered by slug, we could do it here. 
    // But since it's "Shop By Category", getting all active makes sense for now.
    repo.categoryCarousel.getActive().then(setCategories);
  }, []);

  return (
    <PremiumCategoryCarousel 
      categories={categories}
      title="Shop By Category"
      subtitle="Discover premium menswear crafted for every occasion."
    />
  );
}
