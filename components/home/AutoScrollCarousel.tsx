"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Banner } from "@/lib/repositories/interfaces";

interface CarouselSlide {
  id: string | number;
  image: string;
  mobileImage?: string | null;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  targetPage?: string | null;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    image: "/images/banners/banner-1.jpg",
    tagline: "NEW SEASON",
    title: "PREMIUM MENSWEAR",
    subtitle: "ELEVATE YOUR EVERYDAY STYLE",
    description: "Explore our curated collection of luxury cotton shirts, comfort tracks, and accessories.",
    buttonText: "SHOP MENSWEAR",
    buttonLink: "/men",
  },
  {
    id: 2,
    image: "/images/banners/banner-2.jpg",
    tagline: "MUST HAVES",
    title: "TRENDING COLLECTIONS",
    subtitle: "HIGH-DEMAND STYLES",
    description: "Sleek Korean fits, oversized silhouettes, and classic menswear making statements.",
    buttonText: "EXPLORE TRENDS",
    buttonLink: "/collections/trending-collections",
  },
  {
    id: 3,
    image: "/images/banners/banner-3.jpg",
    tagline: "LIMITED TIME",
    title: "DEAL OF THE DAY",
    subtitle: "UNBEATABLE DAILY OFFERS",
    description: "Handpicked selections at exclusive prices. Updated daily so you never miss out.",
    buttonText: "SHOP OFFERS",
    buttonLink: "/collections/deal-of-the-day",
  },
  {
    id: 4,
    image: "/images/banners/banner-4.jpg",
    tagline: "BUNDLE & SAVE",
    title: "COMBO OFFERS",
    subtitle: "COORDINATED WARDROBE SETS",
    description: "Save more when you buy matching sets. Premium shirts paired with tailored trousers.",
    buttonText: "SHOP COMBOS",
    buttonLink: "/collections/combo-offers",
  },
  {
    id: 5,
    image: "/images/banners/banner-5.jpg",
    tagline: "CELEBRATION WEAR",
    title: "FESTIVAL OFFERS",
    subtitle: "DRESS FOR THE OCCASION",
    description: "Premium traditional and semi-formal options at special celebratory pricing.",
    buttonText: "SHOP FESTIVAL",
    buttonLink: "/collections/festival-offers",
  },
];

export default function HeroCarousel({ banners }: { banners?: Banner[] }) {
  // Convert DB banners to slides format, fallback to default slides if none exist
  const activeSlides: CarouselSlide[] = banners && banners.length > 0
    ? banners.map(b => ({
        id: b.id,
        image: b.image_url,
        mobileImage: b.mobile_image_url,
        tagline: b.subtitle || 'EXCLUSIVE',
        title: b.title,
        subtitle: '',
        description: '',
        buttonText: b.button_text || 'SHOP NOW',
        buttonLink: b.link_url || b.target_page || '/shop',
        targetPage: b.target_page
      }))
    : slides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoScrollRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [activeSlides.length]);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  }, [activeSlides.length]);

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
      {activeSlides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div className="relative w-full h-full">
            {/* Desktop Image */}
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={idx === 0}
              className={`object-cover object-top transition-transform duration-[10000ms] ease-linear ${
                slide.mobileImage ? 'hidden md:block' : 'block'
              } ${
                idx === currentSlide ? 'scale-110' : 'scale-100'
              }`}
              sizes="100vw"
            />
            {/* Mobile Image (if available) */}
            {slide.mobileImage && (
              <Image
                src={slide.mobileImage}
                alt={slide.title}
                fill
                priority={idx === 0}
                className={`object-cover object-center transition-transform duration-[10000ms] ease-linear md:hidden ${
                  idx === currentSlide ? 'scale-110' : 'scale-100'
                }`}
                sizes="100vw"
              />
            )}
            
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-black/40 md:bg-black/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center items-center text-center px-4 pb-24 md:pb-0">
            <div
              className={`max-w-4xl mx-auto space-y-4 md:space-y-6 transition-all duration-1000 transform ${
                idx === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
              }`}
            >
              {slide.tagline && (
                <span className="inline-block text-xs md:text-sm font-bold tracking-[0.3em] text-white/90 uppercase border border-white/30 px-3 py-1 rounded-full backdrop-blur-sm">
                  {slide.tagline}
                </span>
              )}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white uppercase tracking-tight leading-[1.1]">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="text-sm md:text-lg lg:text-xl font-medium tracking-[0.2em] text-white/90">
                  {slide.subtitle}
                </p>
              )}
              {slide.description && (
                <p className="text-sm md:text-base text-gray-200 max-w-2xl mx-auto hidden md:block">
                  {slide.description}
                </p>
              )}
              <div className="pt-4 md:pt-8 flex justify-center">
                <Link
                  href={slide.buttonLink || '/shop'}
                  className="group relative inline-flex items-center justify-center px-8 py-3.5 md:py-4 md:px-10 overflow-hidden font-bold tracking-widest text-black bg-white rounded-none md:rounded-lg uppercase text-xs md:text-sm transition-all hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {slide.buttonText}
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </span>
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

      {/* Navigation Indicators */}
      <div className="absolute bottom-6 md:bottom-12 left-0 right-0 z-20 flex justify-center items-center gap-2 md:gap-3 px-4">
        {activeSlides.map((_, idx) => (
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
        {String(activeSlides.length).padStart(2, "0")}
      </div>
    </section>
  );
}