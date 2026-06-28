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
import { addToCart, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '@/lib/redux/slices/wishlistSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { repo, MockCoupon } from '@/lib/repositories';
import { RootState } from '@/lib/redux/store';
import { productService } from '@/services/productService';
import { useAuth } from '@/lib/context/AuthContext';
import { X, Tag } from 'lucide-react';


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
  const [selectedShirtSize, setSelectedShirtSize] = useState<string | null>(null);
  const [selectedPantSize, setSelectedPantSize] = useState<string | null>(null);
  const shirtSizes = product?.sizes?.filter((s: any) => s.type === 'shirt' && s.stock > 0) || [];
  const pantSizes = product?.sizes?.filter((s: any) => s.type === 'pant' && s.stock > 0) || [];
  const genericSizes = product?.sizes?.filter((s: any) => (!s.type || (s.type !== 'shirt' && s.type !== 'pant')) && s.stock > 0) || [];

  const hasShirt = shirtSizes.length > 0;
  const hasPant = pantSizes.length > 0;
  const hasGeneric = !hasShirt && !hasPant && genericSizes.length > 0;
  const [quantity, setQuantity] = useState(1);
  const [sizeWarning, setSizeWarning] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  
  const { user } = useAuth();
  
  const [applicableCoupons, setApplicableCoupons] = useState<MockCoupon[]>([]);
  
  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Customization state removed

  // Zoom & Lightbox state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchScale, setTouchScale] = useState(1);
  const [touchStartDist, setTouchStartDist] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const loadReviews = async () => {
    if (!product) return;
    setReviewsLoading(true);
    try {
      const list = await productService.getReviews(product.id);
      setReviews(list);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      loadReviews();
    }
  }, [product]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeSelectedFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const openLightbox = (idx: number) => {
    setActiveImageIndex(idx);
    setLightboxOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      dispatch(addToast({ message: 'Please sign in to submit a review.', type: 'error' }));
      return;
    }
    setSubmittingReview(true);
    try {
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        for (const file of selectedFiles) {
          const url = await productService.uploadReviewImage(file);
          if (url) uploadedUrls.push(url);
        }
        setUploadingImages(false);
      }

      await productService.submitReview({
        productId: product.id,
        userId: user.id,
        rating: newRating,
        reviewText: newText,
        reviewImages: uploadedUrls,
      });

      dispatch(addToast({ message: 'Review submitted successfully!', type: 'success' }));
      setNewText('');
      setSelectedFiles([]);
      setNewRating(5);
      loadReviews();
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to submit review', type: 'error' }));
    } finally {
      setSubmittingReview(false);
      setUploadingImages(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    async function loadData() {
      try {
        const data = await productService.getProductBySlug(slug);
        if (active && data) {
          setProduct(data);
          const related = await productService.getRelatedProducts(slug);
          setRelatedProducts(related);
          
          const allCoupons = await repo.coupons.getAll();
          const now = new Date();
          const valid = allCoupons.filter(c => 
            c.isActive && 
            (!c.startDate || new Date(c.startDate) <= now) &&
            (!c.endDate || new Date(c.endDate) > now) &&
            (c.applicableProducts?.includes(data.id) || !c.applicableProducts || c.applicableProducts.length === 0)
          );
          setApplicableCoupons(valid);
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
    if (hasShirt && hasPant) {
      if (!selectedShirtSize || !selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select both Shirt and Pant sizes", type: "error" }));
        return;
      }
    } else if (hasShirt) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Shirt size", type: "error" }));
        return;
      }
    } else if (hasPant) {
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Pant size", type: "error" }));
        return;
      }
    } else if (hasGeneric) {
      if (!selectedSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a size", type: "error" }));
        return;
      }
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
          image: product.imageColors && product.imageColors.length > 0 
            ? (product.imageColors.find((c: any) => c.color_name === selectedColor)?.image_url || product.imageColors[0].image_url) 
            : (product.images && product.images.length > 0 ? product.images[0] : ''),
          quantity: quantity,
          size: (hasShirt && hasPant) ? `Shirt: ${selectedShirtSize} / Pant: ${selectedPantSize}` : (hasShirt ? selectedShirtSize : (hasPant ? selectedPantSize : selectedSize)) || undefined,
          color: selectedColor || undefined,
          sku: product.sku || undefined,
        }),
      );
      dispatch(addToast({ message: `${product.title} added to cart! 🛒`, type: "success" }));
      setIsAdding(false);
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }, 800);
  };

  const handleBuyNow = () => {
    if (hasShirt && hasPant) {
      if (!selectedShirtSize || !selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select both Shirt and Pant sizes", type: "error" }));
        return;
      }
    } else if (hasShirt) {
      if (!selectedShirtSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Shirt size", type: "error" }));
        return;
      }
    } else if (hasPant) {
      if (!selectedPantSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a Pant size", type: "error" }));
        return;
      }
    } else if (hasGeneric) {
      if (!selectedSize) {
        setSizeWarning(true);
        dispatch(addToast({ message: "Please select a size", type: "error" }));
        return;
      }
    }
    setSizeWarning(false);
    setIsBuying(true);

    setTimeout(() => {
      dispatch(
        setDirectCheckoutItem({
          selected: true,
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand,
          price: product.price,
          discountedPrice: product.discountedPrice || product.price,
          image: product.imageColors && product.imageColors.length > 0 
            ? (product.imageColors.find((c: any) => c.color_name === selectedColor)?.image_url || product.imageColors[0].image_url) 
            : (product.images && product.images.length > 0 ? product.images[0] : ''),
          quantity: quantity,
          size: (hasShirt && hasPant) ? `Shirt: ${selectedShirtSize} / Pant: ${selectedPantSize}` : (hasShirt ? selectedShirtSize : (hasPant ? selectedPantSize : selectedSize)) || undefined,
          color: selectedColor || undefined,
          sku: product.sku || undefined,
        }),
      );
      
      setIsBuying(false);
      router.push('/checkout');
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

  const visibleImages = product?.imageColors && product.imageColors.length > 0
    ? product.imageColors.map((img: any) => ({ url: img.image_url, color: img.color_name }))
    : (product?.images || []).map((img: string) => ({ url: img, color: product?.colors?.[0] || 'Default' }));

  const selectedColor = visibleImages[activeImageIndex]?.color || '';

  const handleImageChange = (newIndex: number | 'next' | 'prev') => {
    let nextIndex = activeImageIndex;
    if (newIndex === 'next') {
      nextIndex = activeImageIndex === visibleImages.length - 1 ? 0 : activeImageIndex + 1;
    } else if (newIndex === 'prev') {
      nextIndex = activeImageIndex === 0 ? visibleImages.length - 1 : activeImageIndex - 1;
    } else if (typeof newIndex === 'number') {
      nextIndex = newIndex;
    }
    
    setActiveImageIndex(nextIndex);
  };

  const handleColorSelect = (colorName: string) => {
    const firstIndex = visibleImages.findIndex((img: any) => img.color === colorName);
    if (firstIndex !== -1) {
      setActiveImageIndex(firstIndex);
    }
  };

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

              {visibleImages && visibleImages.length > 0 ? (
                <div 
                  className="relative w-full h-full cursor-zoom-in overflow-hidden rounded-2xl"
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => {
                    setIsZoomed(false);
                    setTouchScale(1);
                  }}
                  onMouseMove={(e) => {
                    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - left) / width) * 100;
                    const y = ((e.clientY - top) / height) * 100;
                    setZoomPos({ x, y });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length === 2) {
                      const dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                      );
                      setTouchStartDist(dist);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 2 && touchStartDist > 0) {
                      const dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                      );
                      const scale = (dist / touchStartDist);
                      setTouchScale(Math.min(Math.max(1, scale), 3));
                    }
                  }}
                  onTouchEnd={() => {
                    setTouchScale(1);
                    setTouchStartDist(0);
                  }}
                  onClick={() => openLightbox(activeImageIndex)}
                >
                  <Image
                    src={visibleImages[activeImageIndex]?.url || visibleImages[0]?.url}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-100"
                    style={{
                      transformOrigin: isZoomed ? `${zoomPos.x}% ${zoomPos.y}%` : 'center center',
                      transform: isZoomed ? 'scale(2)' : `scale(${touchScale})`
                    }}
                    priority
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
              
              {visibleImages && visibleImages.length > 1 && (
                <>
                  <button
                    onClick={() => handleImageChange('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => handleImageChange('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {visibleImages && visibleImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {visibleImages.map((img: { url: string, color: string }, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleImageChange(idx)}
                    className={`relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activeImageIndex === idx ? 'border-black' : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`${product.title} ${img.color} ${idx + 1}`}
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

            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-sm">
                    {i < Math.round(product.rating || 5) ? '★' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-xs font-semibold text-[#6b5b4b] uppercase tracking-wider">
                {product.rating ? Number(product.rating).toFixed(1) : '5.0'} ({reviews.length} reviews)
              </span>
            </div>

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

            {applicableCoupons.length > 0 && (
              <div className="mb-6 p-4 border border-green-100 bg-green-50/50 rounded-2xl">
                <h4 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Tag size={16} /> Available Offers
                </h4>
                <ul className="space-y-2 text-sm">
                  {applicableCoupons.map(coupon => (
                    <li key={coupon.code} className="text-green-800 flex flex-col gap-0.5 border-b border-green-100/50 pb-2 last:border-0 last:pb-0">
                      <div>
                        <span className="font-bold font-mono bg-white px-2 py-0.5 rounded border border-green-200 mr-2">{coupon.code}</span>
                        <span className="font-semibold">{coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}</span>
                      </div>
                      <span className="text-xs text-green-700/80">{coupon.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            
            {/* Size Selector */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1a1a1a]">
                  {(hasShirt && hasPant) ? 'Sizes' : 'Size'}
                  {sizeWarning && <span className="text-red-500 text-xs ml-2">* Required</span>}
                </span>
              </div>
              
              <div className="space-y-4">
                  {hasShirt && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{hasPant ? 'Shirt Size' : 'Select Size'}</span>
                      <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all ${sizeWarning && !selectedShirtSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}`}>
                        {shirtSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedShirtSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={'shirt-'+size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedShirtSize(size); setSizeWarning(false); }}
                              className={`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative ${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {hasPant && (
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">{hasShirt ? 'Pant Size' : 'Select Size'}</span>
                      <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all ${sizeWarning && !selectedPantSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}`}>
                        {pantSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedPantSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={'pant-'+size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedPantSize(size); setSizeWarning(false); }}
                              className={`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative ${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {hasGeneric && (
                    <div>
                      <div className={`flex flex-wrap gap-2 p-1.5 rounded-xl border transition-all ${sizeWarning && !selectedSize ? 'border-red-500 bg-red-50/20 shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse' : 'border-transparent'}`}>
                        {genericSizes.map((sizeObj: any) => {
                          const size = sizeObj.size;
                          const isSelected = selectedSize === size;
                          const isOutOfStock = sizeObj.stock === 0;
                          return (
                            <button
                              key={size}
                              disabled={isOutOfStock}
                              onClick={() => { setSelectedSize(size); setSizeWarning(false); }}
                              className={`w-14 h-14 border text-sm font-medium rounded-xl transition-all flex items-center justify-center relative ${isSelected ? 'border-black bg-black text-white shadow-md' : isOutOfStock ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50' : 'border-gray-200 bg-white text-[#1a1a1a] hover:border-black'}`}
                            >
                              {size}
                              {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-[80%] h-[1px] bg-red-400/40 rotate-45" /></div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(!hasShirt && !hasPant && !hasGeneric) && (
                    <p className="text-sm text-gray-400">No sizes available</p>
                  )}
                </div>
            </div>

            {/* Premium Image-based Color Selector */}
            {product.imageColors && product.imageColors.length > 0 ? (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-[#1a1a1a]">Color:</span>
                  <span className="text-sm text-[#6b5b4b] font-medium">{selectedColor || product.imageColors[0]?.color_name}</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {Array.from(new Map(product.imageColors.map((img: any) => [img.color_name, img])).values()).map((imgObj: any) => {
                    const colorName = imgObj.color_name;
                    const isSelected = selectedColor === colorName;
                    
                    return (
                      <button
                        key={colorName}
                        onClick={() => handleColorSelect(colorName)}
                        className={`group relative flex flex-col items-center gap-2 flex-shrink-0 snap-start transition-all duration-300 ${
                          isSelected ? 'scale-100' : 'scale-95 hover:scale-100 opacity-80 hover:opacity-100'
                        }`}
                        title={colorName}
                      >
                        <div className={`relative w-[72px] h-[90px] sm:w-[80px] sm:h-[100px] rounded-lg overflow-hidden bg-[#f5f0eb] transition-all duration-300 ${
                          isSelected 
                            ? 'ring-2 ring-black ring-offset-2 shadow-md' 
                            : 'ring-1 ring-gray-200 group-hover:ring-gray-400 group-hover:shadow-sm'
                        }`}>
                          <Image
                            src={imgObj.image_url}
                            alt={colorName}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <span className={`text-[10px] sm:text-xs font-medium max-w-[80px] truncate transition-colors ${
                          isSelected ? 'text-black font-semibold' : 'text-gray-500 group-hover:text-gray-700'
                        }`}>
                          {colorName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold text-[#1a1a1a]">Color:</span>
                  <span className="text-sm text-[#6b5b4b] font-medium">{selectedColor}</span>
                </div>
                <div className="flex gap-3">
                  {product.colors.map((color: string) => {
                    const isSelected = selectedColor === color;
                    const hex = getColorHex(color);
                    const isWhite = hex.toLowerCase() === '#ffffff';
                    return (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`w-10 h-10 rounded-full transition-all relative flex items-center justify-center ${
                          isSelected ? 'ring-2 ring-black ring-offset-2 scale-110 shadow-md' : 'hover:scale-105 shadow-sm'
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

            {/* Customization Section Removed */}

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

      {/* Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 pt-16 mt-16 mb-16 text-left">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Summary */}
          <div className="space-y-6">
            <h2 className="text-2xl font-light text-[#1a1a1a] uppercase font-serif tracking-wide border-b border-gray-100 pb-3">
              Customer Reviews
            </h2>
            <div className="flex items-baseline gap-4">
              <span className="text-5xl font-serif font-light">{product.rating ? Number(product.rating).toFixed(1) : '5.0'}</span>
              <div>
                <div className="flex text-amber-400 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="text-lg">
                      {i < Math.round(product.rating || 5) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#6b5b4b] uppercase tracking-wider font-semibold">
                  Based on {reviews.length} review{reviews.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <div className="space-y-2 pt-4">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter((r) => r.rating === stars).length;
                const percent = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs text-[#6b5b4b]">
                    <span className="w-3">{stars}★</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-black rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                    <span className="w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Photo gallery */}
            {reviews.some((r) => r.review_images && r.review_images.length > 0) && (
              <div className="space-y-3 pt-6">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest">
                  Review Photos
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {reviews
                    .flatMap((r) => r.review_images || [])
                    .slice(0, 8)
                    .map((imgUrl, i) => (
                      <div 
                        key={i} 
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-gray-100 cursor-zoom-in"
                        onClick={() => {
                          openLightbox(0); // open first product image in lightbox for now
                          // We can dynamically create a lightbox array if needed, but for now lightbox uses product images
                        }}
                      >
                        <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Form and List */}
          <div className="lg:col-span-2 space-y-8">
            {user ? (
              <div className="bg-[#fcfbf9] border border-gray-100 rounded-3xl p-6 sm:p-8 space-y-5">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                  Write a Review
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Rating *</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="text-2xl text-amber-400 hover:scale-110 transition-transform"
                        >
                          {star <= newRating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Review *</label>
                    <textarea
                      rows={4}
                      required
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      placeholder="Share your thoughts about this product's quality, design, and fit..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Add Photos</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="text-xs text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 file:cursor-pointer"
                    />
                    
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative w-16 h-20 rounded-lg overflow-hidden border border-gray-200">
                            <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="py-3 px-6 bg-black hover:bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 text-center space-y-3">
                <p className="text-sm text-gray-500">Please sign in to submit a review.</p>
                <Link href="/login" className="inline-block px-5 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-900 transition-colors">
                  Sign In
                </Link>
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-widest border-b border-gray-50 pb-2">
                Reviews ({reviews.length})
              </h3>
              {reviewsLoading ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="text-sm">
                              {i < rev.rating ? '★' : '☆'}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(rev.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                        {rev.profiles?.full_name || 'Verified Customer'}
                      </p>
                      <p className="text-sm text-gray-600 font-light leading-relaxed">
                        {rev.review_text}
                      </p>
                      {rev.review_images && rev.review_images.length > 0 && (
                        <div className="flex gap-2 pt-2">
                          {rev.review_images.map((imgUrl: string, idx: number) => (
                            <div 
                              key={idx} 
                              className="relative w-20 h-28 rounded-lg overflow-hidden border border-gray-100 cursor-zoom-in"
                              onClick={() => {
                                handleImageChange(idx);
                              }}
                            >
                              <img src={imgUrl} alt="Review attachment" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal overlay */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col justify-between p-4 sm:p-6 select-none">
          <div className="flex justify-between items-center text-white text-sm">
            <span>{activeImageIndex + 1} / {visibleImages.length}</span>
            <button 
              onClick={() => setLightboxOpen(false)}
              className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative max-h-[80vh]">
            <button
              onClick={() => handleImageChange('prev')}
              className="absolute left-2 sm:left-6 z-10 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="relative w-full h-full max-w-4xl aspect-[3/4]">
              <Image
                src={visibleImages[activeImageIndex]?.url}
                alt={product.title}
                fill
                className="object-contain"
              />
            </div>
            <button
              onClick={() => handleImageChange('next')}
              className="absolute right-2 sm:right-6 z-10 bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full transition-all"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          <div className="flex gap-2 justify-center overflow-x-auto py-2">
            {visibleImages.map((img: { url: string, color: string }, idx: number) => (
              <button
                key={idx}
                onClick={() => handleImageChange(idx)}
                className={`relative w-12 h-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                  activeImageIndex === idx ? 'border-white' : 'border-transparent opacity-50 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.url}
                  alt={`Thumbnail ${idx}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}