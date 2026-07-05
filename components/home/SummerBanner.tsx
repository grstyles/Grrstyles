'use client';

import Link from 'next/link';

export default function SummerBanner() {
  return (
    <section className="my-16 md:my-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-lg overflow-hidden">
          {/* Left Side - Image */}
          <div className="h-64 md:h-80 bg-gray-200">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
              alt="Summer essentials"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Content */}
          <div className="bg-amber-50 p-8 md:p-16 flex flex-col justify-center">
            <p className="text-xs md:text-sm font-semibold tracking-widest text-gray-700 mb-4 uppercase">
              Summer Essentials
            </p>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Up to 40% Off
            </h2>
            <Link
              href="/sale"
              className="bg-black text-white px-8 py-3 font-semibold text-sm uppercase tracking-wide hover:bg-gray-900 transition-colors duration-300 w-fit"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
