"use client";
import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingBag } from "lucide-react";

const slides = [
  {
    title: "Premium Shirts Collection",
    subtitle: "Elevate Your Everyday Style",
    description: "Crafted from premium fabrics with meticulous attention to detail. Perfect for the modern man who values quality and sophistication.",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=2000&auto=format&fit=crop",
    ctaText: "Shop Shirts",
    ctaLink: "/shirts",
    secondaryCta: "Explore Collection",
    secondaryCtaLink: "/collections",
    badge: "NEW SEASON"
  },
  {
    title: "Summer Essentials",
    subtitle: "Stay Cool, Stay Stylish",
    description: "Lightweight fabrics and breathable designs for the warmest days. Look sharp while staying comfortable all season long.",
    image: "https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=2000&auto=format&fit=crop",
    ctaText: "Shop Summer",
    ctaLink: "/summer-collection",
    secondaryCta: "View All",
    secondaryCtaLink: "/collections",
    badge: "SUMMER '24"
  },
  {
    title: "Business Collection",
    subtitle: "Executive Style Redefined",
    description: "Sophisticated tailoring meets modern design. From boardroom meetings to client dinners, make a lasting impression.",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=2000&auto=format&fit=crop",
    ctaText: "Shop Business",
    ctaLink: "/business-collection",
    secondaryCta: "View Collection",
    secondaryCtaLink: "/collections",
    badge: "EXECUTIVE"
  },
  {
    title: "Smart Casual Collection",
    subtitle: "Effortless Style for Every Occasion",
    description: "Versatile pieces that transition seamlessly from day to night. Modern cuts with a relaxed sophistication.",
    image: "https://images.unsplash.com/photo-1517438476313-10fd5c2f2f1d?q=80&w=2000&auto=format&fit=crop",
    ctaText: "Shop Smart Casual",
    ctaLink: "/smart-casual",
    secondaryCta: "Explore More",
    secondaryCtaLink: "/collections",
    badge: "BESTSELLER"
  }
];

export default function MensHeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Auto-slide with pause on hover
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused]);

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
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  return (
    <section 
      className="relative h-screen min-h-[700px] overflow-hidden bg-black"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images */}
      <div className="absolute inset-0" ref={slidesRef}>
        {slides.map((slide, index) => (
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
                {slides[currentSlide].badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="anim-text text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.1] mb-3">
              {slides[currentSlide].title}
            </h1>

            {/* Subtitle */}
            <h2 className="anim-text text-2xl sm:text-3xl lg:text-4xl font-bold text-[#D4AF37] mb-4">
              {slides[currentSlide].subtitle}
            </h2>

            {/* Description */}
            <p className="anim-text text-base sm:text-lg text-white/80 leading-relaxed max-w-lg mb-8">
              {slides[currentSlide].description}
            </p>

            {/* CTA Buttons */}
            <div className="anim-text flex flex-wrap gap-4">
              <Link
                href={slides[currentSlide].ctaLink}
                className="btn-hover group bg-[#D4AF37] hover:bg-[#c4a030] text-black px-8 py-4 rounded-full font-semibold tracking-wide transition-all duration-300 inline-flex items-center gap-2 shadow-lg"
              >
                <ShoppingBag size={18} />
                {slides[currentSlide].ctaText}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href={slides[currentSlide].secondaryCtaLink}
                className="btn-hover group bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/30 text-white px-8 py-4 rounded-full font-semibold tracking-wide transition-all duration-300 inline-flex items-center gap-2"
              >
                {slides[currentSlide].secondaryCta}
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
                {String(slides.length).padStart(2, '0')}
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
        {slides.map((_, index) => (
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