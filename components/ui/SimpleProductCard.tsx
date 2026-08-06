"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star, Loader2, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/lib/redux/slices/wishlistSlice";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { addToast } from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { Product } from "@/lib/data/products";

interface SimpleProductCardProps {
  product: Product;
}

// ✅ Make sure this is a default export
export default function SimpleProductCard({ product }: SimpleProductCardProps) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickBuying, setIsQuickBuying] = useState(false);

  const isWishlisted = wishlistItems.some((item: any) => item.id === product.id);
  
  const productName = product.name || product.title || "Product";
  const productSlug = product.slug || product.id;
  const productImages = product.images || ["/placeholder.png"];
  const productBrand = product.brand || "GR STYLES";
  const originalPrice = product.mrpPrice || 0;
  const sellingPrice = product.sellingPrice || originalPrice;
  const discount = originalPrice > sellingPrice ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      dispatch(addToast({ message: "Removed from wishlist", type: "info" }));
    } else {
      dispatch(
        addToWishlist({
          id: product.id,
          slug: productSlug,
          title: productName,
          brand: productBrand,
          price: originalPrice,
          discountedPrice: sellingPrice,
          image: productImages[0],
        })
      );
      dispatch(addToast({ message: "Added to wishlist!", type: "success" }));
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);

    try {
      const defaultColor = product.colors?.[0] || "";
      dispatch(
        addToCart({
          id: product.id,
          slug: productSlug,
          title: productName,
          brand: productBrand,
          price: originalPrice,
          discountedPrice: sellingPrice,
          image: productImages[0],
          quantity: 1,
          size: "One Size",
          color: defaultColor,
          couponApplicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
          is_coupon_applicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
          coupon_applicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
        })
      );
      dispatch(addToast({ message: `${productName} added to cart! 🛒`, type: "success" }));
    } catch (error) {
      dispatch(addToast({ message: "Failed to add to cart", type: "error" }));
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickBuy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isQuickBuying) return;
    setIsQuickBuying(true);

    try {
      const defaultColor = product.colors?.[0] || "";
      dispatch(
        addToCart({
          id: product.id,
          slug: productSlug,
          title: productName,
          brand: productBrand,
          price: originalPrice,
          discountedPrice: sellingPrice,
          image: productImages[0],
          quantity: 1,
          size: "One Size",
          color: defaultColor,
          couponApplicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
          is_coupon_applicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
          coupon_applicable: product.couponApplicable !== false && product.is_coupon_applicable !== false && product.coupon_applicable !== false,
        })
      );
      dispatch(addToast({ message: `Order placed for ${productName}! 🎉`, type: "success" }));
      setTimeout(() => { window.location.href = "/checkout"; }, 500);
    } catch (error) {
      dispatch(addToast({ message: "Failed to place order", type: "error" }));
    } finally {
      setIsQuickBuying(false);
    }
  };

  return (
    <div className="group bg-white border border-gray-100 hover:border-[#D4AF37]/30 transition-all duration-300 hover:shadow-lg rounded-lg overflow-hidden">
      {/* Product Image */}
      <Link href={`/product/${productSlug}`} className="block relative aspect-[3/4] bg-[#F5F0EB] overflow-hidden">
        <Image
          src={productImages[0]}
          alt={productName}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {discount}% OFF
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-all"
        >
          <Heart 
            size={16} 
            className={isWishlisted ? "fill-red-500 stroke-red-500" : "stroke-gray-700"} 
          />
        </button>

        {/* Quick Action Buttons - Show on Hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isAdding}
              className="flex-1 bg-white text-[#111111] text-[10px] font-semibold tracking-[0.1em] uppercase py-2 px-3 rounded hover:bg-[#D4AF37] hover:text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isAdding ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShoppingBag size={12} />
                  Add to Cart
                </>
              )}
            </button>
            <button
              onClick={handleQuickBuy}
              disabled={isQuickBuying}
              className="px-4 py-2 bg-[#D4AF37] text-white text-[10px] font-semibold tracking-[0.1em] uppercase rounded hover:bg-[#C19B2E] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5 min-w-[70px]"
            >
              {isQuickBuying ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Check size={12} />
                  Buy
                </>
              )}
            </button>
          </div>
        </div>
      </Link>

      {/* Product Info - Simple & Clean */}
      <div className="p-3">
        {/* Brand */}
        <p className="text-xs font-semibold text-[#D4AF37] tracking-wider uppercase">
          {productBrand}
        </p>

        {/* Product Name */}
        <Link href={`/product/${productSlug}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-[#D4AF37] transition-colors line-clamp-1 mt-0.5">
            {productName}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1">
          <div className="flex text-[#D4AF37]">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < 4 ? "fill-current" : "text-gray-200"} />
            ))}
          </div>
          <span className="text-[10px] text-gray-400">(0)</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-1.5">
          <span className="text-base font-bold text-gray-900">
            ₹{sellingPrice.toLocaleString()}
          </span>
          {originalPrice > sellingPrice && (
            <span className="text-xs text-gray-400 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
          {discount > 0 && (
            <span className="text-[10px] text-green-600 font-semibold">
              (Save {discount}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}