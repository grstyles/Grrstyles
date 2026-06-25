'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '@/lib/redux/slices/wishlistSlice';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { addToast, openQuickView } from '@/lib/redux/slices/uiSlice';
import { RootState } from '@/lib/redux/store';
import { Product } from '@/lib/data/products';

export interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  const isWishlisted = wishlistItems.some((item) => item.id === product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id));
      dispatch(addToast({ message: 'Removed from wishlist', type: 'info' }));
    } else {
      dispatch(
        addToWishlist({
          id: product.id,
          slug: product.slug,
          title: product.title,
          brand: product.brand ?? '',
          price: product.discountedPrice ?? product.price,
          discountedPrice: product.discountedPrice ?? product.price,
          image: product.images?.[0] ?? '',
        })
      );
      dispatch(addToast({ message: 'Added to wishlist!', type: 'success' }));
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if size is required (has sizes and is not just 'One Size')
    const needsSize =
      product.sizes &&
      product.sizes.length > 0 &&
      !(product.sizes.length === 1 && product.sizes[0].size.toLowerCase() === 'one size');

    if (needsSize) {
      dispatch(addToast({ message: 'Please select a size first', type: 'info' }));
      dispatch(openQuickView(product));
      return;
    }

    // Add to cart directly
    const defaultSize = product.sizes?.[0]?.size || '';
    const defaultColor = product.colors?.[0] || '';

    dispatch(
      addToCart({
        id: product.id,
        slug: product.slug,
        title: product.title,
        brand: product.brand ?? '',
        price: product.price,
        discountedPrice: product.discountedPrice ?? product.price,
        image: product.images?.[0] ?? '',
        quantity: 1,
        size: defaultSize,
        color: defaultColor,
      })
    );

    dispatch(
      addToast({
        message: `${product.title} added to cart! 🛒`,
        type: 'success',
      })
    );
  };

  const displayPrice = product.discountedPrice ?? product.price;
  const originalPrice = product.discountedPrice ? product.price : null;
  const imageUrl = product.images?.[0] || '/placeholder.png';

  const renderStars = () => {
    const rating = product.rating || 4.5;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star size={12} className="text-gray-300" />
            <Star
              size={12}
              className="fill-yellow-400 text-yellow-400 absolute top-0 left-0"
              style={{ clipPath: 'inset(0 50% 0 0)' }}
            />
          </div>
        );
      } else {
        stars.push(<Star key={i} size={12} className="text-gray-300" />);
      }
    }
    return stars;
  };

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100/50"
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* Product Gallery container */}
        <div className="relative aspect-[3/4] bg-[#f5f0eb] overflow-hidden">
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
          
          {/* Badges */}
          <div className="absolute bottom-2.5 right-2.5 flex flex-col items-end gap-1 z-10">
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="bg-red-600 text-white text-[7.5px] tracking-wide font-extrabold px-1.5 py-0.5 rounded-[3px] shadow-sm uppercase">
                {product.discountPercent}% OFF
              </span>
            )}
            {product.bestSeller && (
              <span className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-[7.5px] tracking-wide font-extrabold px-1.5 py-0.5 rounded-[3px] shadow-sm flex items-center gap-0.5 uppercase">
                <Star size={7} className="fill-white" />
                BEST SELLER
              </span>
            )}
            {product.isNew && (
              <span className="bg-green-500 text-white text-[7.5px] tracking-wide font-extrabold px-1.5 py-0.5 rounded-[3px] shadow-sm uppercase">
                NEW
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 z-10 p-2 bg-white/95 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-md hover:scale-110"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={16}
              className={`transition-colors ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-gray-700'}`}
            />
          </button>

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch(openQuickView(product));
                }}
                className="p-2.5 bg-white rounded-full hover:bg-gray-100 transition shadow-md hover:scale-110"
                aria-label="Quick view"
              >
                <Eye size={16} className="text-gray-800" />
              </button>
              <button
                onClick={handleAddToCart}
                className="px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition shadow-md hover:scale-105 flex items-center gap-2 text-xs font-medium"
              >
                <ShoppingBag size={14} />
                Add to Cart
              </button>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4">
          {product.brand && (
            <p className="text-[10px] font-bold tracking-[0.15em] text-[#D4AF37] uppercase mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-[#1a1a1a] line-clamp-2 mb-1 group-hover:text-[#8b7b6b] transition-colors">
            {product.title}
          </h3>
          
          {/* Reviews */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="flex items-center gap-0.5">{renderStars()}</div>
            {product.reviews && <span className="text-[10px] text-gray-400">({product.reviews})</span>}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-base font-bold text-[#1a1a1a]">
              ₹{displayPrice.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                ₹{originalPrice.toLocaleString()}
              </span>
            )}
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="text-[10px] font-semibold text-green-600">
                (Save {product.discountPercent}%)
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}