"use client";

import React from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";

const homeCategories = [
  "Shirts",
  "T-Shirts",
  "Trousers",
  "Jackets",
  "Hoodies",
  "Jeans",
  "Sweatshirts"
];

export default function CategoriesSection() {
  return (
    <PremiumCategoryCarousel 
      categories={homeCategories}
      title="Shop by Category"
      subtitle="Discover premium essentials crafted for modern men."
    />
  );
}
