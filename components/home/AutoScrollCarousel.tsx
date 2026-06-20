"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselSlide {
  id: number;
  image: string;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    image: "/images/image1.jpeg",
    tagline: "NEW ARRIVALS",
    title: "PREMIUM MEN'S WEAR",
    subtitle: "REDEFINE YOUR STYLE",
    description:
      "Discover our latest collection of tailored fits and premium fabrics.",
    buttonText: "SHOP MEN",
    buttonLink: "/collections/men",
  },
  {
    id: 2,
    image: "/images/image2.jpeg",
    tagline: "TRENDING NOW",
    title: "ELEGANT MEN'S FASHION",
    subtitle: "EXPRESS YOURSELF",
    description:
      "From casual chic to evening elegance, find your perfect look.",
    buttonText: "SHOP MEN",
    buttonLink: "/collections/men",
  },
  {
    id: 3,
    image: "/images/image3.jpeg",
    tagline: "SUMMER SALE",
    title: "UP TO 40% OFF",
    subtitle: "SEASONAL ESSENTIALS",
    description:
      "Refresh your wardrobe with our summer collection at unbeatable prices.",
    buttonText: "SHOP SALE",
    buttonLink: "/collections/sale",
  },
  {
    id: 4,
    image: "/images/image4.jpeg",
    tagline: "EXCLUSIVE",
    title: "LIMITED EDITION",
    subtitle: "STREETWEAR CAPSULE",
    description: "Be among the first to own our latest designer collaboration.",
    buttonText: "DISCOVER NOW",
    buttonLink: "/collections/limited-edition",
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (isHovered) {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
      return;
    }

    autoScrollRef.current = setInterval(() => {
      handleNext();
    }, 5000);

    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, [isHovered, handleNext]);

  // Handle swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart === 0 || touchEnd === 0) return;
    if (touchStart - touchEnd > 50) {
      handleNext();
    }
    if (touchEnd - touchStart > 50) {
      handlePrev();
    }
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <section
      className="relative w-full h-[70vh] md:h-[80vh] lg:h-screen bg-black overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="relative w-full h-full">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              className="object-cover"
              sizes="100vw"
              quality={95}
            />
          </div>

          {/* Gradient Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-3xl px-6 md:px-12 lg:px-20 py-12 text-white">
              {/* Tagline */}
              <div className="overflow-hidden mb-4">
                <p className="text-sm md:text-base font-medium tracking-[0.2em] uppercase animate-slide-up">
                  {slide.tagline}
                </p>
              </div>

              {/* Title */}
              <div className="overflow-hidden mb-4">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight animate-slide-up animation-delay-100">
                  {slide.title}
                </h1>
              </div>

              {/* Subtitle */}
              <div className="overflow-hidden mb-4">
                <p className="text-xl md:text-2xl lg:text-3xl font-light animate-slide-up animation-delay-200">
                  {slide.subtitle}
                </p>
              </div>

              {/* Description */}
              <div className="overflow-hidden mb-8">
                <p className="text-sm md:text-base text-gray-200 max-w-lg animate-slide-up animation-delay-300">
                  {slide.description}
                </p>
              </div>

              {/* CTA Button */}
              <div className="animate-slide-up animation-delay-400">
                <Link
                  href={slide.buttonLink}
                  className="inline-flex items-center justify-center bg-white text-black px-8 py-3 md:px-10 md:py-4 font-semibold text-sm uppercase tracking-wider hover:bg-gray-100 transition-all duration-300 hover:scale-105"
                >
                  {slide.buttonText}
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} className="md:w-6 md:h-6" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 bg-black/30 hover:bg-black/50 text-white rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={24} className="md:w-6 md:h-6" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 md:gap-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`transition-all duration-300 cursor-pointer ${
              idx === currentSlide
                ? 'bg-white w-8 md:w-10 h-1 md:h-1.5'
                : 'bg-white/40 hover:bg-white/60 w-3 md:w-4 h-1 md:h-1.5'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

      {/* Optional: Slide counter */}
      <div className="absolute bottom-6 md:bottom-8 right-4 md:right-8 z-20 text-white/60 text-xs md:text-sm font-mono">
        {String(currentSlide + 1).padStart(2, "0")} /{" "}
        {String(slides.length).padStart(2, "0")}
      </div>
    </section>
  );
}