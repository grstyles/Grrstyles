'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="bg-black text-white text-xs md:text-sm py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 text-center text-xs md:text-sm">
          🎉 Free Shipping on Orders Above ₡999 | Get 10% Off on Your First Order | Use Code: WELCOME10 | Easy 15 Days Returns
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
          aria-label="Close offer bar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
