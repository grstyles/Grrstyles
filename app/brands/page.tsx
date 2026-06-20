"use client";

import React, { useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ShoppingBag,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Globe2,
  Tag,
  ChevronRight,
} from "lucide-react";
import gsap from "gsap";

// --- DATA ---

const FEATURED_BRANDS = [
  {
    name: "Ralph Lauren",
    logo: "RL",
    banner:
      "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=800&auto=format&fit=crop",
    count: "1,240",
    year: "1967",
    desc: "Redefining American style.",
  },
  {
    name: "Hugo Boss",
    logo: "BOSS",
    banner:
      "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=800&auto=format&fit=crop",
    count: "850",
    year: "1924",
    desc: "Impeccable tailoring.",
  },
  {
    name: "Tommy Hilfiger",
    logo: "TH",
    banner:
      "https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=800&auto=format&fit=crop",
    count: "920",
    year: "1985",
    desc: "Classic American cool.",
  },
  {
    name: "Calvin Klein",
    logo: "CK",
    banner:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop",
    count: "1,100",
    year: "1968",
    desc: "Modern minimalism.",
  },
  {
    name: "Levi's",
    logo: "LEVI",
    banner:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop",
    count: "600",
    year: "1853",
    desc: "The original denim.",
  },
  {
    name: "Lacoste",
    logo: "LA",
    banner:
      "https://images.unsplash.com/photo-1618677603286-0ec56cb6e1b5?q=80&w=800&auto=format&fit=crop",
    count: "450",
    year: "1933",
    desc: "Sport-inspired elegance.",
  },
  {
    name: "Armani Exchange",
    logo: "AX",
    banner:
      "https://images.unsplash.com/photo-1490578474895-699bc4e3f444?q=80&w=800&auto=format&fit=crop",
    count: "720",
    year: "1991",
    desc: "Urban spirit.",
  },
  {
    name: "Massimo Dutti",
    logo: "MD",
    banner:
      "https://images.unsplash.com/photo-1507680434567-5739c80be1ac?q=80&w=800&auto=format&fit=crop",
    count: "380",
    year: "1985",
    desc: "Urban elegance & quality.",
  },
];

const ALPHABET_BRANDS = {
  A: ["Armani Exchange", "Alexander McQueen", "Ami Paris"],
  B: ["Boss", "Balenciaga", "Burberry"],
  C: ["Calvin Klein", "Comme des Garçons", "Common Projects"],
  G: ["Gucci", "Givenchy"],
  L: ["Levi's", "Lacoste", "Loewe"],
  M: ["Massimo Dutti", "Moncler", "Marni"],
  P: ["Prada", "Polo Ralph Lauren"],
  R: ["Ralph Lauren", "Rick Owens"],
  T: ["Tommy Hilfiger", "Tom Ford"],
  Z: ["Zara", "Zegna"],
};

const LUXURY_HOUSES = [
  {
    name: "Armani",
    img: "https://images.unsplash.com/photo-1594938298596-eb5fd3f6b98e?q=80&w=1000&auto=format&fit=crop",
    desc: "Timeless elegance and refined tailoring from the iconic Italian house.",
  },
  {
    name: "Hugo Boss",
    img: "https://images.unsplash.com/photo-1488161628813-04466f872524?q=80&w=1000&auto=format&fit=crop",
    desc: "Power dressing redefined for the modern gentleman.",
  },
  {
    name: "Ralph Lauren",
    img: "https://images.unsplash.com/photo-1550614000-4b95d4ebfa84?q=80&w=1000&auto=format&fit=crop",
    desc: "The epitome of classic American luxury and heritage craftsmanship.",
  },
  {
    name: "Massimo Dutti",
    img: "https://images.unsplash.com/photo-1616086185885-3b102bb68dc5?q=80&w=1000&auto=format&fit=crop",
    desc: "Sophisticated European aesthetics tailored for everyday elegance.",
  },
];

const TRENDING_BRANDS = [
  {
    title: "Most Popular",
    name: "Zara",
    img: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=600&auto=format&fit=crop",
    rating: "4.9",
    count: "10k+",
  },
  {
    title: "New Arrival",
    name: "Tom Ford",
    img: "https://images.unsplash.com/photo-1623880352554-073c6b245224?q=80&w=600&auto=format&fit=crop",
    rating: "4.8",
    count: "250",
  },
  {
    title: "Best Selling",
    name: "Polo Ralph Lauren",
    img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=600&auto=format&fit=crop",
    rating: "4.9",
    count: "5k+",
  },
  {
    title: "Premium Essentials",
    name: "Calvin Klein",
    img: "https://images.unsplash.com/photo-1506169894395-36397e4aa54a?q=80&w=600&auto=format&fit=crop",
    rating: "4.7",
    count: "3k+",
  },
];

const BRAND_COLLECTIONS = [
  {
    name: "Classic Oxford Shirt",
    price: "₹125",
    rating: "4.8",
    brand: "Ralph Lauren",
    img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Signature Piqué Polo",
    price: "₹98",
    rating: "4.9",
    brand: "Ralph Lauren",
    img: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Tailored Wool Trousers",
    price: "₹295",
    rating: "4.7",
    brand: "Ralph Lauren",
    img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Quilted Field Jacket",
    price: "₹495",
    rating: "4.9",
    brand: "Ralph Lauren",
    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop",
  },
];

const GALLERY = [
  "https://images.unsplash.com/photo-1490578474895-699bc4e3f444?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520975954732-57dd22299614?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488161628813-04466f872524?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516826957135-700ede19c6ce?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593030103066-0093718efeb9?q=80&w=600&auto=format&fit=crop",
];

// --- COMPONENTS ---

export default function PremiumBrandsPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    // GSAP animations for initial load
    gsap.fromTo(
      ".hero-text",
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.2, duration: 1, ease: "power3.out" },
    );
  }, []);

  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  return (
    <div className="bg-[#FAF9F6] text-[#2C2C2C] font-['Inter',_sans-serif] min-h-screen overflow-x-hidden selection:bg-[#D4AF37] selection:text-white">
      {/* 1. HERO SECTION */}
      <section
        ref={heroRef}
        className="relative w-full h-[90vh] overflow-hidden flex items-center justify-center"
      >
        <motion.div
          style={{ y: heroY }}
          className="absolute inset-0 w-full h-[120%] -top-[10%]"
        >
          <img
            src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=1920&auto=format&fit=crop"
            alt="Luxury Menswear"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        </motion.div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto text-white mt-20">
          <p className="hero-text text-sm md:text-base font-semibold tracking-[0.3em] uppercase text-[#E5D3B3] mb-6">
            Premium Brands
          </p>
          <h1 className="hero-text text-5xl md:text-7xl lg:text-8xl font-['Playfair_Display',_serif] leading-tight mb-6">
            Discover The World's Finest Menswear
          </h1>
          <p className="hero-text text-lg md:text-xl font-light text-gray-200 mb-10 max-w-2xl mx-auto">
            Explore iconic fashion houses and contemporary labels curated for
            modern gentlemen.
          </p>
          <div className="hero-text flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="px-8 py-4 bg-white text-black text-sm uppercase tracking-widest hover:bg-[#E5D3B3] hover:text-black transition-colors duration-300 w-full sm:w-auto">
              Explore Brands
            </button>
            <button className="px-8 py-4 bg-transparent border border-white text-white text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-300 w-full sm:w-auto">
              Shop Collections
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED BRANDS */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-4">
                Featured Brands
              </h2>
              <p className="text-gray-500 font-light max-w-lg">
                Handpicked labels that define contemporary luxury and timeless
                elegance.
              </p>
            </div>
            <a
              href="#"
              className="hidden md:flex items-center text-sm uppercase tracking-widest hover:text-[#D4AF37] transition-colors border-b border-black hover:border-[#D4AF37] pb-1"
            >
              View All <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURED_BRANDS.map((brand, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                key={brand.name}
                className="group cursor-pointer flex flex-col"
              >
                <div className="relative overflow-hidden aspect-[3/4] mb-6">
                  <img
                    src={brand.banner}
                    alt={brand.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500"></div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <button className="px-6 py-3 bg-white/90 backdrop-blur-sm text-black text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-colors">
                      Explore Brand
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-['Playfair_Display',_serif] font-bold mb-1">
                      {brand.name}
                    </h3>
                    <p className="text-sm text-gray-500 font-light">
                      {brand.desc}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-mono tracking-widest border border-gray-200 px-2 py-1">
                    EST. {brand.year}
                  </span>
                </div>
                <div className="mt-4 text-sm text-[#D4AF37] flex items-center">
                  {brand.count} Products{" "}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. LUXURY BRANDS SECTION (Magazine Style) */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#F5F3EC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-['Playfair_Display',_serif] mb-6">
              Luxury Fashion Houses
            </h2>
            <p className="text-gray-600 font-light max-w-2xl mx-auto text-lg">
              Immerse yourself in the world of high fashion, where exquisite
              craftsmanship meets visionary design.
            </p>
          </div>

          <div className="space-y-24">
            {LUXURY_HOUSES.map((house, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-200px" }}
                transition={{ duration: 0.8 }}
                key={house.name}
                className={`flex flex-col md:flex-row items-center gap-12 ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="w-full md:w-3/5 relative group overflow-hidden">
                  <img
                    src={house.img}
                    alt={house.name}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                </div>
                <div className="w-full md:w-2/5 flex flex-col justify-center px-4 md:px-12">
                  <h3 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-6">
                    {house.name}
                  </h3>
                  <p className="text-gray-600 font-light leading-relaxed mb-10 text-lg">
                    {house.desc}
                  </p>
                  <a
                    href="#"
                    className="inline-flex items-center text-sm uppercase tracking-widest border-b border-black pb-2 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all w-fit"
                  >
                    Explore Collection <ArrowRight className="w-4 h-4 ml-3" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SHOP BY BRAND (A-Z) */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-16 text-center">
            Brand Directory
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-12 gap-y-16">
            {Object.entries(ALPHABET_BRANDS).map(([letter, brands]) => (
              <div key={letter}>
                <h3 className="text-4xl font-['Playfair_Display',_serif] text-[#E5D3B3] mb-6 border-b border-gray-100 pb-2">
                  {letter}
                </h3>
                <ul className="space-y-4">
                  {brands.map((brand) => (
                    <li key={brand}>
                      <a
                        href="#"
                        className="text-gray-600 hover:text-black transition-colors font-light text-lg relative group inline-block"
                      >
                        {brand}
                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-black transition-all group-hover:w-full"></span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BRAND COLLECTIONS (Featured Products) */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#1A1A1A] text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <p className="text-[#D4AF37] tracking-widest uppercase text-sm mb-4">
                Spotlight
              </p>
              <h2 className="text-4xl md:text-6xl font-['Playfair_Display',_serif]">
                Ralph Lauren{" "}
                <span className="font-light italic text-gray-400">
                  Collection
                </span>
              </h2>
            </div>
            <button className="px-8 py-3 border border-white hover:bg-white hover:text-black transition-colors text-sm uppercase tracking-widest">
              View Entire Collection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {BRAND_COLLECTIONS.map((product, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                key={idx}
                className="group relative"
              >
                <div className="relative aspect-[3/4] mb-4 overflow-hidden bg-gray-800">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                  />

                  {/* Actions */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <button className="p-2 bg-white/10 backdrop-blur-md hover:bg-white hover:text-black rounded-full transition-colors opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300">
                      <Heart className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <button className="w-full py-3 bg-white text-black font-medium text-sm uppercase tracking-widest hover:bg-[#D4AF37] hover:text-white transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                    {product.brand}
                  </p>
                  <h3 className="text-lg font-light mb-2">{product.name}</h3>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{product.price}</span>
                    <div className="flex items-center text-xs text-yellow-500">
                      <Star className="w-3 h-3 fill-current mr-1" />{" "}
                      {product.rating}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TRENDING BRANDS */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-16 text-center">
            Trending Now
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRENDING_BRANDS.map((item, idx) => (
              <motion.div
                whileHover={{ y: -10 }}
                key={idx}
                className="relative overflow-hidden group aspect-square flex flex-col justify-end p-6"
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="relative z-10 text-white">
                  <span className="inline-block px-3 py-1 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider mb-3">
                    {item.title}
                  </span>
                  <h3 className="text-3xl font-['Playfair_Display',_serif] mb-2">
                    {item.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-300 gap-4">
                    <span className="flex items-center">
                      <Star className="w-4 h-4 fill-current text-yellow-400 mr-1" />{" "}
                      {item.rating}
                    </span>
                    <span>{item.count} items</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BRAND STORIES */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 relative">
              <div className="aspect-[4/5] relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1594938328870-9117e8ea4c74?q=80&w=800&auto=format&fit=crop"
                  alt="Craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 w-2/3 aspect-square bg-[#E5D3B3] z-0 hidden md:block"></div>
            </div>

            <div className="w-full lg:w-1/2 space-y-8">
              <h4 className="text-[#D4AF37] tracking-widest uppercase text-sm font-semibold">
                Editorial
              </h4>
              <h2 className="text-5xl md:text-6xl font-['Playfair_Display',_serif] leading-tight">
                The Heritage of <br /> True Craftsmanship
              </h2>
              <p className="text-gray-600 text-lg font-light leading-relaxed">
                Behind every premium brand lies a story of relentless dedication
                to quality. From the finest Italian leathers to the most
                delicate silks, discover the history, design philosophy, and the
                masterful artisans that bring these iconic collections to life.
              </p>
              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-200">
                <div>
                  <h5 className="font-bold text-xl mb-2 font-['Playfair_Display',_serif]">
                    History
                  </h5>
                  <p className="text-sm text-gray-500 font-light">
                    Decades of redefining style.
                  </p>
                </div>
                <div>
                  <h5 className="font-bold text-xl mb-2 font-['Playfair_Display',_serif]">
                    Philosophy
                  </h5>
                  <p className="text-sm text-gray-500 font-light">
                    Innovation meets tradition.
                  </p>
                </div>
              </div>
              <button className="mt-8 px-8 py-4 bg-black text-white text-sm uppercase tracking-widest hover:bg-[#D4AF37] transition-colors">
                Read Brand Stories
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TOP DESIGNER PICKS */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-4">
              Top Designer Picks
            </h2>
            <p className="text-gray-500 font-light">
              Curated selections for the discerning gentleman.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Editor's Choice",
                brand: "Tom Ford",
                img: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?q=80&w=600&auto=format&fit=crop",
              },
              {
                title: "Best Luxury",
                brand: "Armani",
                img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop",
              },
              {
                title: "Best Casual",
                brand: "Polo Ralph Lauren",
                img: "https://images.unsplash.com/photo-1550614000-4b95d4ebfa84?q=80&w=600&auto=format&fit=crop",
              },
              {
                title: "Best Denim",
                brand: "Levi's Made & Crafted",
                img: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=600&auto=format&fit=crop",
              },
            ].map((pick, idx) => (
              <div
                key={idx}
                className="group cursor-pointer relative overflow-hidden aspect-[4/5] flex items-center justify-center"
              >
                <img
                  src={pick.img}
                  alt={pick.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-500"></div>
                <div className="relative z-10 text-center text-white border border-white/30 p-8 m-6 backdrop-blur-sm group-hover:border-white/80 transition-colors">
                  <p className="text-xs uppercase tracking-widest mb-3 opacity-80">
                    {pick.title}
                  </p>
                  <h3 className="text-2xl font-['Playfair_Display',_serif]">
                    {pick.brand}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BRAND CAMPAIGN GALLERY */}
      <section className="py-24 px-4 bg-[#F5F3EC]">
        <div className="max-w-[1600px] mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-12">
            Campaign Gallery
          </h2>

          <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
            {GALLERY.map((img, idx) => (
              <div
                key={idx}
                className="relative group overflow-hidden break-inside-avoid"
              >
                <img
                  src={img}
                  alt="Campaign"
                  className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-500 flex items-center justify-center">
                  <div className="text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    <p className="uppercase tracking-widest text-sm font-semibold border-b border-white pb-1">
                      View Editorial
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. WHY SHOP OUR BRANDS */}
      <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-['Playfair_Display',_serif] mb-16 text-center">
            The Luxury Experience
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {[
              {
                icon: Globe2,
                title: "Global Fashion Brands",
                desc: "Curated collections from the world's most renowned fashion capitals.",
              },
              {
                icon: ShieldCheck,
                title: "Authentic Products",
                desc: "100% guarantee of authenticity on all luxury items, sourced directly.",
              },
              {
                icon: Truck,
                title: "Free Premium Shipping",
                desc: "Complimentary express delivery on all brand orders over ₹500.",
              },
              {
                icon: RotateCcw,
                title: "Easy Returns",
                desc: "Hassle-free 30-day return policy for a perfect fit.",
              },
              {
                icon: ShieldCheck,
                title: "Secure Checkout",
                desc: "State-of-the-art encryption to ensure your luxury purchases are safe.",
              },
              {
                icon: Tag,
                title: "Exclusive Brand Offers",
                desc: "Members receive early access to private sales and limited editions.",
              },
            ].map((feature, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 mx-auto bg-[#FAF9F6] rounded-full flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:text-white transition-colors duration-300">
                  <feature.icon className="w-8 h-8 font-light" />
                </div>
                <h3 className="text-xl font-['Playfair_Display',_serif] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-500 font-light text-sm">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. NEWSLETTER SECTION */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1594938298596-eb5fd3f6b98e?q=80&w=1920&auto=format&fit=crop"
            alt="Newsletter Background"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center text-white p-12 bg-white/10 backdrop-blur-md border border-white/20">
          <h2 className="text-4xl md:text-5xl font-['Playfair_Display',_serif] mb-6">
            Stay Updated With Top Brands
          </h2>
          <p className="font-light text-gray-300 mb-10 text-lg">
            Get early access to new brand launches, exclusive collections, and
            member-only offers directly to your inbox.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Your Email Address"
              className="flex-1 bg-transparent border border-white/40 px-6 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:border-white transition-colors"
              required
            />
            <button
              type="submit"
              className="px-8 py-4 bg-white text-black text-sm uppercase tracking-widest font-semibold hover:bg-[#D4AF37] hover:text-white transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
