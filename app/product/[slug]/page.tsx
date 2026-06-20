'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check,
  Truck,
  RotateCcw,
  Shield
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '@/lib/redux/slices/wishlistSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { RootState } from '@/lib/redux/store';
import { productService } from '@/services/productService';


export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useDispatch();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const cartItems = useSelector((state: RootState) => state.cart.items);

  useEffect(() => {
    let active = true;
    setLoading(true);
    async function loadData() {
      try {
        const data = await productService.getProductBySlug(slug);
        if (active && data) {
          setProduct(data);
          if (data.colors && data.colors.length > 0) {
            setSelectedColor(data.colors[0]);
          }
          const related = await productService.getRelatedProducts(slug);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlistItems.some((item) => item.id === product.id));
    }
  }, [wishlistItems, product]);

  const handleWishlist = () => {
    if (!product) return;
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      dispatch(addToast({ message: "Removed from wishlist", type: "info" }));
    } else {
      dispatch(
        addToWishlist({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          price: product.discountedPrice || product.price,
          discountedPrice: product.discountedPrice || product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
        }),
      );
      dispatch(addToast({ message: "Added to wishlist!", type: "success" }));
    }
  };

  const handleAddToCart = () => {
    const sizeRequired = product?.sizes && product.sizes.length > 0 && !(product.sizes.length === 1 && product.sizes[0].size.toLowerCase() === 'one size');
    if (sizeRequired && !selectedSize) {
      setSizeWarning(true);
      dispatch(addToast({ message: "Please select a size first", type: "error" }));
      return;
    }
    setSizeWarning(false);
    setIsAdding(true);

    setTimeout(() => {
      dispatch(
        addToCart({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discountedPrice: product.discountedPrice || product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          quantity: quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined
        }),
      );
      dispatch(addToast({ message: `${product.title} added to cart! 🛒`, type: "success" }));
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }, 800);
  };

  const handleBuyNow = () => {
    const sizeRequired = product?.sizes && product.sizes.length > 0 && !(product.sizes.length === 1 && product.sizes[0].size.toLowerCase() === 'one size');
    if (sizeRequired && !selectedSize) {
      setSizeWarning(true);
      dispatch(addToast({ message: "Please select a size first", type: "error" }));
      return;
    }
    setSizeWarning(false);
    setIsBuying(true);

    setTimeout(() => {
      dispatch(
        addToCart({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discountedPrice: product.discountedPrice || product.price,
          image: product.images && product.images.length > 0 ? product.images[0] : '',
          quantity: quantity,
          size: selectedSize || undefined,
          color: selectedColor || undefined
        }),
      );
      dispatch(addToast({ message: `${product.title} added to cart! 🛒`, type: "success" }));
      setIsBuying(false);
      router.push('/cart');
    }, 600);
  };

  const getColorHex = (colorName: string) => {
    if (!colorName) return '#d1d5db';
    const lower = colorName.toLowerCase();
    if (lower.includes('black')) return '#111111';
    if (lower.includes('white')) return '#ffffff';
    if (lower.includes('navy') || lower.includes('blue')) return '#1a2e4c';
    if (lower.includes('grey') || lower.includes('gray')) return '#8c8c8c';
    if (lower.includes('beige') || lower.includes('khaki')) return '#f5ebd6';
    if (lower.includes('olive') || lower.includes('green')) return '#3b4c3f';
    if (lower.includes('brown') || lower.includes('tan')) return '#8b5a2b';
    if (lower.includes('pink')) return '#f4a0b5';
    if (lower.includes('light blue')) return '#89b5d6';
    return '#d1d5db';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b7b6b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#6b5b4b]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f6]">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-light text-[#1a1a1a] mb-4">Product Not Found</h2>
          <p className="text-[#6b5b4b] mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/" className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6b5b4b] hover:text-[#1a1a1a] transition-colors text-sm"
        >
          <ChevronLeft size={20} />
          Back
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Left Column - Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-[#f5f0eb] rounded-2xl overflow-hidden">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.discountPercent > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    On sale
                  </span>
                )}
              </div>
              
              <div className="absolute top-4 right-4 z-10">
                {product.inStock && (
                  <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    In stock
                  </span>
                )}
              </div>

              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[activeImageIndex] || product.images[0]}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              
              {product.images && product.images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((idx) => idx === 0 ? product.images.length - 1 : idx - 1)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((idx) => idx === product.images.length - 1 ? 0 : idx + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImageIndex === idx ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.title} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="flex flex-col">
            <p className="text-xs font-bold tracking-[0.2em] text-[#D4AF37] uppercase mb-1">
              {product.brand}
            </p>

            <h1 className="text-2xl sm:text-3xl font-medium text-[#1a1a1a] mb-2">
              {product.title}
            </h1>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-3xl font-bold text-[#1a1a1a]">
                ₹{product.discountedPrice?.toLocaleString() || product.price?.toLocaleString()}
              </span>
              {product.discountedPrice && (
                <span className="text-sm text-gray-400 line-through">
                  ₹{product.price?.toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-sm text-[#6b5b4b] leading-relaxed mb-4 max-w-md">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  Size
                  {sizeWarning && <span className="text-red-500 text-xs ml-2">* Required</span>}
                </span>
              </div>
              <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all ${
                sizeWarning ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'
              }`}>
                {product.sizes && product.sizes.length > 0 ? (
                  product.sizes.map((sizeObj: any) => {
                    const size = sizeObj.size;
                    const isSelected = selectedSize === size;
                    const isOutOfStock = sizeObj.stock === 0;
                    return (
                      <button
                        key={size}
                        disabled={isOutOfStock}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeWarning(false);
                        }}
                        className={`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative ${
                          isSelected 
                            ? 'border-black bg-black text-white shadow-md' 
                            : isOutOfStock
                              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                              : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'
                        }`}
                        title={isOutOfStock ? `${size} (Out of Stock)` : `${size} (${sizeObj.stock} remaining)`}
                      >
                        {size}
                        {isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No sizes available</p>
                )}
              </div>
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <span className="text-sm font-medium text-[#1a1a1a] block mb-2">
                  Color
                </span>
                <div className="flex gap-3">
                  {product.colors.map((color: string) => {
                    const isSelected = selectedColor === color;
                    const hex = getColorHex(color);
                    const isWhite = hex.toLowerCase() === '#ffffff';
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center ${
                          isSelected ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: hex, border: isWhite ? '1px solid #d1d5db' : 'none' }}
                        title={color}
                      >
                        {isSelected && (
                          <Check size={14} className={isWhite ? 'text-black' : 'text-white'} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <span className="text-sm font-medium text-[#1a1a1a] block mb-2">
                Quantity
              </span>
              <div className="flex items-center border border-gray-200 rounded-xl w-36">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-3 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors rounded-l-xl"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="flex-1 text-center text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-4 py-3 hover:bg-gray-100 text-gray-400 hover:text-black transition-colors rounded-r-xl"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={handleBuyNow}
                disabled={isAdding || isBuying}
                className="flex-1 py-4 bg-black hover:bg-gray-900 text-white text-sm font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 disabled:bg-gray-400"
              >
                {isBuying ? "Processing..." : "Buy Now"}
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isBuying}
                className={`flex-1 py-4 border-2 text-sm font-semibold uppercase tracking-wider rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${
                  addedSuccess
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-black bg-white hover:bg-black hover:text-white text-black"
                }`}
              >
                {isAdding ? (
                  "Adding..."
                ) : addedSuccess ? (
                  <span className="flex items-center gap-1.5">
                    <Check size={16} /> Added
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag size={16} /> Add to Cart
                  </span>
                )}
              </button>
              <button
                onClick={handleWishlist}
                className="px-5 py-4 border border-gray-200 hover:border-black rounded-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center"
              >
                <Heart size={20} className={isWishlisted ? 'fill-red-500 stroke-red-500 text-red-500' : 'text-gray-700'} />
              </button>
            </div>

            {/* View Cart Link */}
            {cartCount > 0 && (
              <Link 
                href="/cart" 
                className="text-center text-sm text-[#D4AF37] hover:underline mb-4 transition-colors block"
              >
                View Cart ({cartCount} items)
              </Link>
            )}

            {/* Shipping & Payment Info */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f0eb] rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield size={18} className="text-[#8b7b6b]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a]">Secure payments via</p>
                    <p className="text-xs text-[#6b5b4b]">{product.securePayment || 'Razorpay'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f0eb] rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck size={18} className="text-[#8b7b6b]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a]">Free shipping over</p>
                    <p className="text-xs text-[#6b5b4b]">₹2,000 · 3-5 day delivery</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#f5f0eb] rounded-full flex items-center justify-center flex-shrink-0">
                    <RotateCcw size={18} className="text-[#8b7b6b]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a]">Customer care on every</p>
                    <p className="text-xs text-[#6b5b4b]">order</p>
                  </div>
                </div>
              </div>
              
              {product.inStock && (
                <div className="mt-4 text-xs text-green-600 bg-green-50 px-4 py-2 rounded-xl inline-block">
                  ✓ In stock — ships within 24-48 hours.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-light text-[#1a1a1a] mb-8 text-center">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((item: any) => (
                <Link href={`/product/${item.slug}`} key={item.id} className="group">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-[3/4]">
                      {item.discountPercent > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                          On sale
                        </div>
                      )}
                      <Image
                        src={item.images?.[0] || '/images/placeholder.jpg'}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-2 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6b5b4b] mb-1">{item.brand}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold">₹{item.discountedPrice?.toLocaleString() || item.price?.toLocaleString()}</span>
                        {item.discountedPrice && (
                          <span className="text-xs text-gray-400 line-through">₹{item.price?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}