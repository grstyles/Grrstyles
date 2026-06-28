// components/ui/QuickViewModal.tsx

"use client";
import Image from "next/image";
import { X, Heart, Minus, Plus, Truck, Shield, RotateCcw, Check, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { addToWishlist, removeFromWishlist } from "@/lib/redux/slices/wishlistSlice";
import { addToCart } from "@/lib/redux/slices/cartSlice";
import { addToast } from "@/lib/redux/slices/uiSlice";
import { RootState } from "@/lib/redux/store";
import { useState } from "react";

interface QuickViewModalProps {
  product: any | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [sizeError, setSizeError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const isWishlisted = useSelector((s: RootState) => 
    product ? s.wishlist.items.some((i) => i.id === product.id) : false
  );

  if (!product) return null;

  const price = product.discountedPrice ?? product.price;
  const original = product.discountedPrice ? product.price : null;
  const image = product.images?.[0] ?? "/placeholder.png";

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      dispatch(addToast({ message: "Removed from wishlist", type: "info" }));
    } else {
      dispatch(addToWishlist({ 
        id: product.id, 
        slug: product.slug, 
        title: product.title, 
        brand: product.brand ?? "", 
        price, 
        discountedPrice: price, 
        image 
      }));
      dispatch(addToast({ message: "Added to wishlist!", type: "success" }));
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check size selection
    const sizeRequired =
      product.sizes &&
      product.sizes.length > 0 &&
      !(
        product.sizes.length === 1 &&
        (typeof product.sizes[0] === "string"
          ? product.sizes[0]
          : product.sizes[0].size || ""
        ).toLowerCase() === "one size"
      );

    if (sizeRequired && !selectedSize) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select a size first", type: "error" }));
      return;
    }
    setSizeError(false);
    setIsAdding(true);

    setTimeout(() => {
      dispatch(
        addToCart({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand ?? "",
          price: product.price,
          discountedPrice: price,
          image,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        })
      );

      dispatch(
        addToast({
          message: `${product.title} added to cart! 🛒`,
          type: "success",
        })
      );

      setIsAdding(false);
      setAddedSuccess(true);

      setTimeout(() => {
        setAddedSuccess(false);
        onClose();
      }, 600);
    }, 800);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const sizeRequired =
      product.sizes &&
      product.sizes.length > 0 &&
      !(
        product.sizes.length === 1 &&
        (typeof product.sizes[0] === "string"
          ? product.sizes[0]
          : product.sizes[0].size || ""
        ).toLowerCase() === "one size"
      );

    if (sizeRequired && !selectedSize) {
      setSizeError(true);
      dispatch(addToast({ message: "Please select a size first", type: "error" }));
      return;
    }
    setSizeError(false);
    setIsBuying(true);

    setTimeout(() => {
      dispatch(
        setDirectCheckoutItem({
          selected: true,
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand ?? "",
          price: product.price,
          discountedPrice: price,
          image,
          quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined,
        })
      );

      setIsBuying(false);
      onClose();
      router.push("/checkout");
    }, 600);
  };

  const getColorHex = (color: string) => {
    const colors: Record<string, string> = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Blue': '#2563EB',
      'Navy': '#1A2A4A',
      'Grey': '#6B7280',
      'Beige': '#F5E6D3',
      'Brown': '#92400E',
      'Red': '#DC2626',
      'Green': '#16A34A',
      'Pink': '#EC4899',
      'Light Blue': '#89B5D6',
    };
    return colors[color] || '#D1D5DB';
  };

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[999] p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        // Only close when clicking the backdrop itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
        initial={{ scale: 0.93, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 15 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all hover:scale-110 border border-gray-100"
        >
          <X size={16} className="text-gray-600" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          {/* Gallery section */}
          <div className="md:col-span-2 relative bg-[#f5f0eb] aspect-square md:aspect-auto md:h-full min-h-[300px]">
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
              {product.discountPercent > 0 && (
                <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  {product.discountPercent}% OFF
                </span>
              )}
              {product.inStock && (
                <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  In stock
                </span>
              )}
            </div>

            <button
              onClick={toggleWishlist}
              className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-all hover:scale-110 border border-gray-100"
            >
              <Heart size={14} className={isWishlisted ? "fill-red-500 stroke-red-500" : "stroke-gray-700"} />
            </button>

            <Image
              src={image}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              priority
            />
          </div>

          {/* Details section */}
          <div className="md:col-span-3 p-5 flex flex-col justify-between max-h-[85vh] md:max-h-[500px] overflow-y-auto">
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-1">
                {product.brand || "GR STYLES"}
              </p>

              <h2 className="text-lg md:text-xl font-medium text-[#1a1a1a] mb-1 line-clamp-2">
                {product.title}
              </h2>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-xl font-bold text-[#1a1a1a]">
                  ₹{price.toLocaleString()}
                </span>
                {original && (
                  <span className="text-sm text-gray-400 line-through">
                    ₹{original.toLocaleString()}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#6b5b4b] leading-relaxed mb-4">
                {product.description || "Premium quality product designed for comfort and style."}
              </p>

              {/* Size selector */}
              {product.sizes?.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-[#1a1a1a]">
                      Size
                      {sizeError && <span className="text-red-500 text-[10px] ml-2">* Size selection required</span>}
                    </span>
                  </div>
                  <div className={`flex flex-wrap gap-1.5 p-1 rounded-xl transition-all border ${
                    sizeError ? 'border-red-500 bg-red-50/30 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'
                  }`}>
                    {product.sizes.map((sizeObj: any) => {
                      const sizeName = typeof sizeObj === 'string' ? sizeObj : sizeObj.size || "";
                      const isOutOfStock = typeof sizeObj === 'object' && sizeObj.stock === 0;
                      const isSelected = selectedSize === sizeName;

                      return (
                        <button
                          key={sizeName}
                          disabled={isOutOfStock}
                          onClick={() => {
                            setSelectedSize(sizeName);
                            setSizeError(false);
                          }}
                          className={`w-9 h-9 border rounded-xl text-xs font-medium transition-all flex items-center justify-center relative ${
                            isSelected
                              ? "border-black bg-black text-white scale-105"
                              : isOutOfStock
                                ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"
                                : "border-gray-200 hover:border-black text-gray-700 bg-white"
                          }`}
                          title={isOutOfStock ? `${sizeName} (Out of Stock)` : sizeName}
                        >
                          {sizeName}
                          {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Color selector */}
              {product.colors?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-semibold text-[#1a1a1a] block mb-1.5">Color</span>
                  <div className="flex gap-2">
                    {product.colors.map((color: string) => {
                      const isSelected = selectedColor === color;
                      const hex = getColorHex(color);
                      const isWhite = color === "White";
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`w-6 h-6 rounded-full border transition-all relative flex items-center justify-center ${
                            isSelected
                              ? "ring-2 ring-black ring-offset-2 scale-110 shadow-sm"
                              : "border-gray-200 hover:scale-105"
                          }`}
                          style={{ 
                            backgroundColor: hex,
                          }}
                          title={color}
                        >
                          {isSelected && (
                            <Check size={10} className={isWhite ? 'text-black' : 'text-white'} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-4">
                <span className="text-xs font-semibold text-[#1a1a1a] block mb-1.5">Quantity</span>
                <div className="flex items-center border border-gray-200 rounded-xl w-24">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors rounded-l-xl"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="flex-1 text-center text-xs font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors rounded-r-xl"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>

            {/* Actions & Logistics */}
            <div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleBuyNow}
                  disabled={isAdding || isBuying}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center bg-black text-white hover:bg-gray-900`}
                >
                  {isBuying ? "Processing..." : "Buy Now"}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || isBuying}
                  className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center border-2 border-black ${
                    addedSuccess
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-white text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {isAdding ? (
                    "Adding..."
                  ) : addedSuccess ? (
                    <span className="flex items-center gap-1.5">
                      <Check size={14} /> Added!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag size={14} /> Add to Cart
                    </span>
                  )}
                </button>
              </div>

              {/* Logistics */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                <div className="flex flex-col items-center text-center">
                  <Shield size={14} className="text-[#8b7b6b] mb-1" />
                  <p className="text-[8px] font-bold text-[#1a1a1a]">Secure Payments</p>
                  <p className="text-[7px] text-[#6b5b4b]">Razorpay</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Truck size={14} className="text-[#8b7b6b] mb-1" />
                  <p className="text-[8px] font-bold text-[#1a1a1a]">Free Shipping</p>
                  <p className="text-[7px] text-[#6b5b4b]">Over ₹2,000</p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <RotateCcw size={14} className="text-[#8b7b6b] mb-1" />
                  <p className="text-[8px] font-bold text-[#1a1a1a]">Easy Returns</p>
                  <p className="text-[7px] text-[#6b5b4b]">10 Day Policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}