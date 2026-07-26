"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingBag } from "lucide-react";
import { repo } from "@/lib/repositories";

const slides = [
  {
    title: "New Arrivals",
    subtitle: "FRESH SEASON SELECTIONS",
    description: "Upgrade your wardrobe with our newest cuts, premium fabrics, and modern fits.",
    image: "/images/banners/banner-1.jpg",
    ctaText: "Shop New",
    ctaLink: "/new-in",
    secondaryCta: "Explore All",
    secondaryCtaLink: "/collections",
    badge: "JUST LANDED"
  },
  {
    title: "Premium Shirts",
    subtitle: "COTTON & LINEN MASTERPIECES",
    description: "Crisp formal oxfords, elegant linen designs, and comfortable casual shirting.",
    image: "/images/banners/banner-2.jpg",
    ctaText: "Shop Shirts",
    ctaLink: "/category/shirts",
    secondaryCta: "Explore All",
    secondaryCtaLink: "/collections",
    badge: "CLASSIC SHIRTING"
  },
  {
    title: "Denim Collection",
    subtitle: "PERFECT FIT & WASHES",
    description: "Distressed streetwear fits, classic straight cuts, and stretch denim built to last.",
    image: "/images/banners/banner-3.jpg",
    ctaText: "Shop Denim",
    ctaLink: "/category/denim-jeans",
    secondaryCta: "Explore All",
    secondaryCtaLink: "/collections",
    badge: "EVERYDAY JEANS"
  },
  {
    title: "Formal Collection",
    subtitle: "TAILORED BUSINESS WEAR",
    description: "Structured office shirts, sharp trousers, and formal combos for the professional.",
    image: "/images/banners/banner-4.jpg",
    ctaText: "Shop Formals",
    ctaLink: "/category/formal-pant",
    secondaryCta: "Explore All",
    secondaryCtaLink: "/collections",
    badge: "OFFICE ELEGANCE"
  },
  {
    title: "Weekend Collection",
    subtitle: "RELAXED LIFESTYLE SHIRTS",
    description: "Unstructured casual shirts, night tracks, and comfort wear for your off-duty days.",
    image: "/images/banners/banner-5.jpg",
    ctaText: "Shop Casuals",
    ctaLink: "/category/trousers",
    secondaryCta: "Explore All",
    secondaryCtaLink: "/collections",
    badge: "SMART CASUAL"
  }
];

export default function MensHeroCarousel() {
  const [carouselSlides, setCarouselSlides] = useState(slides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  const loadMensBanners = useCallback(async () => {
    try {
      const banners = await repo.banners.getActive();
      const menBanners = banners.filter(
        (b) =>
          b.target_page === 'men' ||
          b.target_page === '/men' ||
          b.target_page === 'mens' ||
          b.target_page === '/mens'
      );
      if (menBanners.length > 0) {
        setCarouselSlides((prev) => {
          const next = [...prev];
          menBanners.forEach((mb, idx) => {
            if (next[idx]) {
              next[idx] = {
                ...next[idx],
                image: mb.image_url || next[idx].image,
                title: mb.title || next[idx].title,
                subtitle: mb.subtitle || next[idx].subtitle,
              };
            }
          });
          return next;
        });
        return;
      }
      const navData = await repo.navigation?.getByPage('mens');
      if (navData?.imageUrl) {
        setCarouselSlides((prev) => {
          const next = [...prev];
          next[0] = { ...next[0], image: navData.imageUrl };
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to load mens hero image', err);
    }
  }, []);

  useEffect(() => {
    loadMensBanners();
    const handleUpdate = () => loadMensBanners();
    window.addEventListener('gr_banner_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('gr_banner_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadMensBanners]);

  // Auto-slide with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, carouselSlides.length]);

  // GSAP Animations on slide change
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text animation
      gsap.fromTo(
        ".anim-text",
        { y: 40, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.15, 
          ease: "power4.out" 
        }
      );

      // Image zoom effect
      gsap.fromTo(
        imageRef.current,
        { scale: 1.1 },
        { 
          scale: 1, 
          duration: 1.5, 
          ease: "power2.out" 
        }
      );

      // Badge animation
      gsap.fromTo(
        ".badge-anim",
        { x: -30, opacity: 0 },
        { 
          x: 0, 
          opacity: 1, 
          duration: 0.8, 
          ease: "power3.out" 
        }
      );

      // Button hover effects
      document.querySelectorAll(".btn-hover").forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out"
          });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        });
      });
    }, textRef);

    return () => ctx.revert();
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === carouselSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));
  };

  return (
    <section 
      className="relative h-screen min-h-[700px] overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images */}
      <div className="absolute inset-0" ref={slidesRef}>
        {carouselSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              ref={imageRef}
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center" ref={textRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl text-white">
            {/* Badge */}
            <div className="badge-anim inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
              <span className="text-xs font-medium tracking-[0.2em] uppercase text-[#D4AF37]">
                {carouselSlides[currentSlide].badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="anim-text text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] mb-3">
              {carouselSlides[currentSlide].title}
            </h1>

            {/* Subtitle */}
            <h2 className="anim-text text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-4">
              {carouselSlides[currentSlide].subtitle}
            </h2>

            {/* Description */}
            <p className="anim-text text-base sm:text-lg text-white/80 leading-relaxed max-w-lg mb-8">
              {carouselSlides[currentSlide].description}
            </p>

            {/* CTA Buttons */}
            <div className="anim-text flex flex-wrap gap-4">
              <Link
                href={carouselSlides[currentSlide].ctaLink}
                className="btn-hover group bg-[#D4AF37] hover:bg-[#c4a030] text-black px-8 py-4 rounded-full font-semibold tracking-wide transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                <ShoppingBag size={18} />
                {carouselSlides[currentSlide].ctaText}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={carouselSlides[currentSlide].secondaryCtaLink}
                className="btn-hover group bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-full font-semibold tracking-wide transition-all duration-300 inline-flex items-center gap-2"
              >
                {carouselSlides[currentSlide].secondaryCta}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Slide Counter */}
            <div className="anim-text flex items-center gap-3 mt-8">
              <span className="text-sm font-light text-white/60">
                {String(currentSlide + 1).padStart(2, '0')}
              </span>
              <div className="w-12 h-[1px] bg-white/30" />
              <span className="text-sm font-light text-white/40">
                {String(carouselSlides.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-20 border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all duration-300 hover:scale-110 z-20 border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {carouselSlides.map((_, index) => (
          <button
            key={index}
            className={`transition-all duration-500 rounded-full ${
              index === currentSlide 
                ? 'w-12 h-2 bg-[#D4AF37]' 
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 right-8 text-white/10 text-8xl font-bold font-serif select-none z-10">
        {String(currentSlide + 1).padStart(2, '0')}
      </div>
    </section>
  );
}