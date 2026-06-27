"use client";

import React from "react";
import PremiumCategoryCarousel from "@/components/ui/PremiumCategoryCarousel";

const menCategories = [
  "Shirts",
  "Printed Shirts",
  "T-Shirts",
  "Jackets",
  "Night Tracks",
  "Accessories",
  "Formal Shirts",
  "Formal Pant",
  "Trousers",
  "Denim Jeans",
  "Shoes"
];

export default function MensCategoryCarousel() {
  return (
    <PremiumCategoryCarousel 
      categories={menCategories}
      title="Shop By Category"
      subtitle="Discover premium menswear crafted for every occasion."
    />
  );
}
