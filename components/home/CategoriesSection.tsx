"use client";

import React, { useState, useEffect } from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";
import { repo } from "@/lib/repositories";
import { CategoryCarouselItem } from "@/lib/repositories/categoryCarouselRepository";

export default function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryCarouselItem[]>([]);

  useEffect(() => {
    repo.categoryCarousel.getActive().then(setCategories);
  }, []);

  return (
    <PremiumCategoryCarousel 
      categories={categories}
      title="Shop by Category"
      subtitle="Discover premium essentials crafted for modern men."
    />
  );
}
