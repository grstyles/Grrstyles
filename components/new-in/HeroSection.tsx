"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Sparkles } from "lucide-react";

export default function HeroSection() {
  const textRef = useRef(null);
  const imageRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Badge animation
      gsap.from(badgeRef.current, {
        y: -20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.2,
      });

      // Text animations with stagger
      gsap.from(".hero-text-anim", {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power4.out",
        delay: 0.4,
      });

      // Image animation
      gsap.from(imageRef.current, {
        opacity: 0,
        scale: 1.1,
        duration: 1.8,
        ease: "power3.out",
        delay: 0.3,
      });

      // Floating badge animation
      gsap.to(".floating-badge", {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });

      // Button hover effect
      gsap.utils.toArray(".btn-hover").forEach((btn: any) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, {
            scale: 1.05,
            duration: 0.3,
            ease: "power2.out",
          });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            scale: 1,
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });
    }, textRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen bg-[#faf8f6] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#8b7b6b] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#c4a882] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-[#8b7b6b]/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#8b7b6b]/10 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 min-h-screen py-20">
          
          {/* Left Content */}
          <div className="flex-1 lg:pr-12" ref={textRef}>
            {/* Badge */}
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 bg-[#1a1a1a] text-white px-4 py-2 rounded-full mb-6 floating-badge"
            >
              <Sparkles size={16} className="text-[#c4a882]" />
              <span className="text-xs font-medium tracking-wider uppercase">
                Korean Collection 2026
              </span>
            </div>

            {/* Main Content */}
            <div className="hero-text-anim">
              <p className="text-[#8b7b6b] text-sm font-medium tracking-[0.3em] uppercase mb-4">
                Premium Korean Streetwear
              </p>
            </div>

            <h1 className="hero-text-anim text-4xl sm:text-5xl lg:text-7xl font-light leading-[1.1] text-[#1a1a1a] mb-6">
              Elevate Your
              <br />
              <span className="font-bold bg-gradient-to-r from-[#1a1a1a] to-[#8b7b6b] bg-clip-text text-transparent">
                Korean Style
              </span>
            </h1>

            <p className="hero-text-anim text-[#6b5b4b] text-lg leading-relaxed max-w-lg mb-8">
              Discover the latest Korean fashion trends — oversized silhouettes, 
              premium fabrics, and street-ready styles designed for the modern man.
            </p>

            {/* Combo Offer Badge */}
            <div className="hero-text-anim flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-[#e8e3dc] rounded-lg px-4 py-3 mb-8 max-w-sm">
              <div className="bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1 rounded-full">
                COMBO
              </div>
              <div className="text-sm text-[#1a1a1a]">
                <span className="font-semibold">2 for ₹2,999</span>
                <span className="text-[#6b5b4b] text-xs ml-2">Save ₹1,000</span>
              </div>
              <ArrowRight size={16} className="text-[#8b7b6b] ml-auto" />
            </div>

            {/* CTA Buttons */}
            <div className="hero-text-anim flex flex-wrap gap-4">
              <Link
                href="/men"
                className="btn-hover group relative bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-medium tracking-wide hover:bg-[#2a2a2a] transition-all duration-300 inline-flex items-center gap-2 overflow-hidden"
              >
                <ShoppingBag size={18} />
                <span>Shop Now</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/collections"
                className="btn-hover group bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] px-8 py-4 rounded-full font-medium tracking-wide hover:bg-[#1a1a1a] hover:text-white transition-all duration-300 inline-flex items-center gap-2"
              >
                <span>Explore Collection</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="hero-text-anim flex items-center gap-6 mt-8 pt-6 border-t border-[#e8e3dc]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-[#6b5b4b]">500+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1a1a1a]">⭐ 4.9</span>
                <span className="text-xs text-[#6b5b4b]">(200+ Reviews)</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs text-[#6b5b4b]">✨ Premium Quality</span>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex-1" ref={imageRef}>
            <div className="relative">
              {/* Main Image */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=1000&fit=crop"
                  alt="Korean Fashion Menswear"
                  className="w-full h-[600px] sm:h-[700px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              </div>

              {/* Floating Badge - Top Right */}
              <div className="absolute -top-6 -right-6 bg-white shadow-xl rounded-2xl p-4 max-w-[160px] floating-badge">
                <div className="flex items-center gap-3">
                  <div className="bg-[#1a1a1a] text-white rounded-full p-2">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b5b4b] uppercase tracking-wider">Trending</p>
                    <p className="text-sm font-bold text-[#1a1a1a]">Korean Style</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge - Bottom Left */}
              <div className="absolute -bottom-6 -left-6 bg-white shadow-xl rounded-2xl p-4 floating-badge">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-[#c4a882] border-2 border-white flex items-center justify-center text-white text-xs font-bold">K</div>
                    <div className="w-8 h-8 rounded-full bg-[#8b7b6b] border-2 border-white flex items-center justify-center text-white text-xs font-bold">S</div>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#6b5b4b] uppercase tracking-wider">Combo Offers</p>
                    <p className="text-sm font-bold text-[#1a1a1a]">Save 30%</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge - Bottom Right */}
              <div className="absolute -bottom-4 -right-4 bg-[#1a1a1a] text-white shadow-xl rounded-2xl px-5 py-3 floating-badge">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">₩</span>
                  <div>
                    <p className="text-[10px] text-[#c4a882] uppercase tracking-wider">Premium</p>
                    <p className="text-sm font-bold">Korean Collection</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}