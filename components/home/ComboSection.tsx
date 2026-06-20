'use client';

import React from 'react';
import ComboSection, { ComboItem } from '@/components/ui/ComboSection';

export default function HomeComboSection() {
  const combos: ComboItem[] = [
    {
      id: 1,
      title: 'Formal Combo',
      description: 'Shirt + Trouser Bundle',
      originalPrice: 6498,
      discountedPrice: 4999,
      slug: 'formal-combo',
      images: [
        '/images/products/shirts/black-formal-shirt.png',
        '/images/products/trousers/black-formal-trouser.png',
      ],
    },
    {
      id: 2,
      title: 'Weekend Combo',
      description: 'T-Shirt + Jeans Bundle',
      originalPrice: 4998,
      discountedPrice: 3699,
      slug: 'weekend-combo',
      images: [
        '/images/products/tshirts/black-oversized-tshirt.png',
        '/images/products/jeans/baggy-denim-blue.png',
      ],
    },
    {
      id: 3,
      title: 'Festival Combo',
      description: 'Shirt + Trouser + Watch Bundle',
      originalPrice: 12497,
      discountedPrice: 8999,
      slug: 'festival-combo',
      images: [
        '/images/products/shirts/printed-weekend-shirt.png',
        '/images/products/trousers/beige-korean-trouser.png',
        '/images/products/accessories/minimalist-silver-watch.png',
      ],
    },
    {
      id: 4,
      title: 'Office Combo',
      description: 'Formal Shirt + Formal Pant Bundle',
      originalPrice: 6998,
      discountedPrice: 5299,
      slug: 'office-combo',
      images: [
        '/images/products/shirts/striped-office-shirt.png',
        '/images/products/trousers/navy-office-trouser.png',
      ],
    },
  ];

  return (
    <ComboSection 
      title="COMBO OFFERS" 
      subtitle="Complete outfits curated by fashion experts at exclusive bundle savings." 
      combos={combos} 
    />
  );
}
