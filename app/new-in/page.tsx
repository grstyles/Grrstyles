"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ChevronRight, Quote, 
  Clock, Shield, Truck, Award, Sparkles,
  Play, Eye, Heart, ShoppingBag
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/lib/redux/slices/wishlistSlice";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { addToast, openQuickView } from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { Product } from "@/lib/data/products";
import { repo } from "@/lib/repositories";
import ProductCard from "@/components/ui/ProductCard";

// =============================================
// TYPES
// =============================================
interface Testimonial {
  id: number;
  name: string;
  role: string;
  content: string;
  rating: number;
  image: string;
}

// =============================================
// DATA
// =============================================
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Aarav Sharma",
    role: "Fashion Enthusiast",
    content: "The quality and fit are exceptional. GR STYLES has become my go-to for premium everyday wear.",
    rating: 5,
    image: "/images/avatar1.jpg"
  },
  {
    id: 2,
    name: "Rohan Mehta",
    role: "Style Consultant",
    content: "Finally a brand that understands modern men's fashion. The Korean collection is outstanding.",
    rating: 5,
    image: "/images/avatar2.jpg"
  },
  {
    id: 3,
    name: "Vikram Singh",
    role: "Creative Director",
    content: "The attention to detail and fabric quality rivals luxury brands. Highly recommended.",
    rating: 5,
    image: "/images/avatar3.jpg"
  }
];

const styleArticles = [
  {
    id: 1,
    title: "The Art of Layering",
    excerpt: "Master the art of layering with our premium collection.",
    image: "/images/article1.jpg",
    date: "June 2026"
  },
  {
    id: 2,
    title: "Modern Minimalism",
    excerpt: "Embrace clean lines and timeless silhouettes.",
    image: "/images/article2.jpg",
    date: "June 2026"
  },
  {
    id: 3,
    title: "The Korean Wave",
    excerpt: "How Korean streetwear is shaping global fashion.",
    image: "/images/article3.jpg",
    date: "May 2026"
  }
];

const categories = [
  { name: "Shirts", image: "/images/p1.jpeg", count: "12 Items", slug: "shirts" },
  { name: "T-Shirts", image: "/images/p2.jpeg", count: "8 Items", slug: "t-shirts" },
  { name: "Trousers", image: "/images/p3.jpeg", count: "15 Items", slug: "trousers" },
  { name: "Jackets", image: "/images/p4.jpeg", count: "6 Items", slug: "jackets" },
  { name: "Shoes", image: "/images/p5.jpeg", count: "10 Items", slug: "shoes" },
  { name: "Accessories", image: "/images/p6.jpeg", count: "14 Items", slug: "accessories" },
];

const marqueeItems = [
  "NEW COLLECTION 2026",
  "FREE SHIPPING IN INDIA",
  "PREMIUM COTTON",
  "MADE FOR MODERN MEN",
  "KOREAN STREETWEAR",
  "TIMELESS DESIGN",
];

// =============================================
// ANIMATION VARIANTS
// =============================================
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

// =============================================
// MAIN COMPONENT
// =============================================
export default function NewInPage() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const { scrollYProgress } = useScroll();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const targetRef = useRef<HTMLDivElement>(null);

  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await repo.products.getAll();
        const curated = allProducts.map((p: any) => {
          let images = p.images || [];
          if (p.slug === "stone-shaped-wide-leg-jeans") {
            images = ["/images/product1.jpg", "/images/shop5.jpg"];
          } else if (p.slug === "bow-printed-jeans") {
            images = ["/images/shop4.jpeg", "/images/shop6.jpg"];
          } else if (p.slug === "premium-stone-jeans") {
            images = ["/images/shop3.jpeg", "/images/shop7.jpg"];
          } else if (p.slug === "slim-fit-black-shirt") {
            images = ["/images/shop1.jpeg", "/images/shop2.jpeg"];
          } else if (p.slug === "casual-linen-shirt") {
            images = ["/images/shop1.jpeg", "/images/shop2.jpeg"];
          } else if (p.slug === "denim-jacket") {
            images = ["/images/shop2.jpeg", "/images/shop3.jpeg"];
          } else if (p.slug === "premium-sneakers") {
            images = ["/images/shop5.jpg", "/images/shop6.jpg"];
          }
          return { ...p, images };
        });
        setProducts(curated);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = products.slice(0, 8);
  const featuredProduct = products[0];

  const scrollToSection = () => {
    const section = document.getElementById('latest');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[11px] text-[#777777] tracking-[0.2em] uppercase font-light">Loading Collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFAFA] text-[#111111] overflow-x-hidden">

      {/* ============================================
      1. LUXURY HERO
      ============================================ */}
      <section className="relative h-[70vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/image1.jpeg"
            alt="New Arrivals Campaign"
            fill
            priority
            className="object-cover object-center scale-105 animate-[subtleZoom_20s_ease-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/60 via-[#111111]/45 to-[#111111]/75" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center text-white flex flex-col items-center">
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-xs md:text-sm font-bold tracking-[0.35em] text-[#D4AF37] uppercase mb-4"
          >
            SPRING / SUMMER EDIT
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl md:text-8xl font-light font-playfair tracking-[0.1em] mb-6 select-none"
          >
            NEW IN
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-base md:text-xl font-light font-inter max-w-2xl text-gray-200/90 leading-relaxed mb-8 tracking-wide"
          >
            The Latest Arrivals For Modern Men. Discover premium shirts, Korean
            streetwear, formal essentials, jackets, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button
              onClick={scrollToSection}
              className="group relative px-10 py-4 border border-white text-white font-medium text-xs uppercase tracking-[0.25em] overflow-hidden transition-all duration-500 hover:text-black hover:border-white hover:scale-105"
            >
              <span className="absolute inset-0 w-0 bg-white transition-all duration-500 ease-out group-hover:w-full -z-10" />
              Shop Now
            </button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span className="text-[10px] text-white/50 tracking-[0.2em] uppercase">
            Scroll
          </span>
          <div className="w-[1px] h-10 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white rounded animate-[scrollIndicator_2s_infinite]" />
          </div>
        </div>
      </section>

      {/* ============================================
      2. LUXURY MARQUEE
      ============================================ */}
      <section className="bg-[#111111] border-y border-white/5 py-4 overflow-hidden">
        <div className="flex whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="animate-[marquee_40s_linear_infinite] flex gap-12 pr-12 text-white/60 font-light text-[11px] tracking-[0.3em] uppercase"
            >
              {marqueeItems.map((item, idx) => (
                <React.Fragment key={idx}>
                  <span>✦ {item}</span>
                  <span className="text-[#C9A84C]/30">•</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
      3. TRENDING NOW - Editorial Cards
      ============================================ */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <p className="text-[10px] text-[#777777] tracking-[0.3em] uppercase font-light">Trending</p>
            <h2 className="text-3xl md:text-4xl font-light font-playfair tracking-wide text-[#111111] mt-1">
              Editor&apos;s Picks
            </h2>
          </div>
          <Link href="/collections" className="text-[11px] text-[#777777] hover:text-[#C9A84C] transition-colors flex items-center gap-1 font-light">
            View All <ChevronRight size={14} />
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {products.slice(0, 2).map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative overflow-hidden bg-[#F5F0EB]"
            >
              <Link href={`/product/${product.slug || product.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name || "Product"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A84C] font-light">
                    {product.brand || "GR STYLES"}
                  </p>
                  <h3 className="text-xl font-light font-playfair mt-1">{product.name || "Product"}</h3>
                  <p className="text-sm font-light text-white/70 mt-0.5">
                    ₹{(product.sellingPrice || product.mrpPrice || 0).toLocaleString()}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============================================
      4. EDITOR'S PICKS - Product Grid
      ============================================ */}
      <section id="latest" className="py-20 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-[10px] text-[#777777] tracking-[0.3em] uppercase font-light">Collection</p>
          <h2 className="text-3xl md:text-4xl font-light font-playfair tracking-wide text-[#111111] mt-1">
            Editor&apos;s Picks
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
        >
          {filteredProducts.map((product) => (
            <motion.div key={product.id} variants={fadeUp}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <Link
            href="/collections"
            className="group inline-flex items-center gap-3 px-10 py-3.5 border border-[#111111] text-[#111111] text-[11px] tracking-[0.2em] uppercase font-light hover:bg-[#111111] hover:text-white transition-all duration-300"
          >
            View All Products
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ============================================
      5. NEW THIS WEEK - Magazine Layout
      ============================================ */}
      <section className="py-20 px-6 max-w-7xl mx-auto border-t border-[#EAEAEA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-[10px] text-[#777777] tracking-[0.3em] uppercase font-light">Weekly Edit</p>
          <h2 className="text-3xl md:text-4xl font-light font-playfair tracking-wide text-[#111111] mt-1">
            New This Week
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Product */}
          {featuredProduct && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 group relative overflow-hidden bg-[#F5F0EB]"
            >
              <Link href={`/product/${featuredProduct.slug || featuredProduct.id}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={featuredProduct.images?.[0] || "/placeholder.png"}
                    alt={featuredProduct.name || "Product"}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-[#C9A84C] font-light">
                    Featured
                  </p>
                  <h3 className="text-xl font-light font-playfair mt-1">
                    {featuredProduct.name || "Product"}
                  </h3>
                  <p className="text-sm font-light text-white/70">
                    ₹{(featuredProduct.sellingPrice || featuredProduct.mrpPrice || 0).toLocaleString()}
                  </p>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Supporting Products */}
          <div className="flex flex-col gap-4">
            {products.slice(1, 4).map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group flex items-center gap-4 bg-white p-3 border border-[#EAEAEA] hover:border-[#C9A84C] transition-colors"
              >
                <Link href={`/product/${product.slug || product.id}`} className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-[#F5F0EB]">
                  <Image
                    src={product.images?.[0] || "/placeholder.png"}
                    alt={product.name || "Product"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div>
                  <p className="text-[9px] text-[#C9A84C] tracking-[0.2em] uppercase font-light">
                    {product.brand || "GR STYLES"}
                  </p>
                  <h4 className="text-sm font-light text-[#111111] line-clamp-1">
                    {product.name || "Product"}
                  </h4>
                  <p className="text-xs font-light text-[#777777]">
                    ₹{(product.sellingPrice || product.mrpPrice || 0).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
      GLOBAL STYLES
      ============================================ */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scrollIndicator {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { transform: translateY(0%); opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes subtleZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.05); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
}