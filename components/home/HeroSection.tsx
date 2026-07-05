"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-[70vh] md:min-h-[80vh] bg-amber-50 flex items-center overflow-hidden">
      {/* Content Left Side */}
      <div className="relative z-10 w-full md:w-1/2 px-6 md:px-8 lg:px-12 py-12 md:py-0">
        <div className="max-w-xl">
          {/* Label */}
          <p className="text-xs md:text-sm font-semibold tracking-widest text-gray-700 mb-4 uppercase">
            New Season '24
          </p>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-gray-900 mb-6 text-balance leading-tight">
            Men's Collection
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-800 mb-3 font-light">
            Elevate Your Everyday Style
          </p>

          {/* Description */}
          <div className="mb-8 space-y-2">
            <p className="text-sm md:text-base text-gray-700">
              Premium essentials.
            </p>
            <p className="text-sm md:text-base text-gray-700">
              Designed for confidence.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/products?category=shirts"
              className="bg-black text-white px-8 py-3 font-semibold text-sm uppercase tracking-wide hover:bg-gray-900 transition-colors duration-300 text-center"
            >
              Shop Shirts
            </Link>
            <Link
              href="/products?category=jackets"
              className="border-2 border-black text-black px-8 py-3 font-semibold text-sm uppercase tracking-wide hover:bg-black hover:text-white transition-colors duration-300 text-center"
            >
              Shop Jackets
            </Link>
          </div>

          {/* Carousel Dots */}
          <div className="flex gap-2 mt-12">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${i === 0 ? 'w-8 bg-black' : 'w-2 bg-gray-400'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Image Right Side */}
      <div className="hidden md:block absolute right-0 top-0 h-full w-1/2">
        <img
          src="/images/heroes/home_hero_banner.png"
          alt="Model wearing collection"
          className="w-full h-full object-cover"
        />
      </div>
    </section>
  );
}
