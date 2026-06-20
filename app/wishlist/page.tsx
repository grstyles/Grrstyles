'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { removeFromWishlist } from '@/lib/redux/slices/wishlistSlice';
import { addToCart } from '@/lib/redux/slices/cartSlice';
import { formatPrice } from '@/lib/utils/helpers';
import { Heart, Trash2 } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  const handleAddToCart = (item: any) => {
    dispatch(
      addToCart({
        id: item.id,
        slug: item.slug,
        title: item.title,
        brand: item.brand,
        price: item.price,
        discountedPrice: item.discountedPrice,
        image: item.image,
        quantity: 1,
      })
    );
    dispatch(addToast({ message: 'Added to cart!', type: 'success' }));
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12">
          <h1 className="text-4xl font-bold mb-8">Wishlist</h1>
          <div className="text-center py-16">
            <Heart size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-600 mb-6">Your wishlist is empty</p>
            <Link href="/" className="inline-block bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12">
        <h1 className="text-4xl font-bold mb-8">Wishlist ({wishlistItems.length})</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
                <Image src={item.image} alt={item.title} fill className="object-cover hover:scale-110 transition-transform duration-300" />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-bold text-sm md:text-base mb-1 truncate">{item.title}</h3>
                <p className="text-xs text-gray-600 mb-3">{item.brand}</p>

                {/* Pricing */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-400 line-through text-xs">{formatPrice(item.price)}</span>
                  <span className="font-bold">{formatPrice(item.discountedPrice)}</span>
                </div>

                {/* Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="w-full bg-black text-white py-2 rounded font-semibold text-sm hover:bg-gray-800 transition-colors"
                  >
                    Move to Cart
                  </button>
                  <button
                    onClick={() => dispatch(removeFromWishlist(item.id))}
                    className="w-full border-2 border-red-500 text-red-500 py-2 rounded font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
