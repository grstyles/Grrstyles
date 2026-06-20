'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { Minus, Plus, Trash2, ArrowLeft, Tag, ShoppingBag, ShieldCheck, Truck, Percent } from 'lucide-react';
import { RootState } from '@/lib/redux/store';
import { removeFromCart, updateQuantity, applyPromo, removePromo } from '@/lib/redux/slices/cartSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { formatPrice } from '@/lib/utils/helpers';
import { repo } from '@/lib/repositories';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const subtotal = useSelector((state: RootState) => state.cart.total);
  const discountPercent = useSelector((state: RootState) => state.cart.discountPercent);
  const appliedCode = useSelector((state: RootState) => state.cart.appliedPromo);

  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  // Shipping logic: Free over ₹2,000, else ₹100
  const shipping = subtotal >= 2000 ? 0 : subtotal > 0 ? 100 : 0;
  // Tax logic: GST 12%
  const tax = Math.round(subtotal * 0.12);
  // Promo discount
  const discount = Math.round((subtotal * discountPercent) / 100);
  // Final total
  const finalTotal = subtotal - discount + shipping + tax;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = promoCode.toUpperCase().trim();

    if (!code) {
      setPromoError('Please enter a coupon code.');
      return;
    }

    try {
      const result = await repo.coupons.apply(code);
      if (result.valid) {
        dispatch(applyPromo({ code, percent: result.discount }));
        setPromoError('');
        dispatch(addToast({ message: result.message, type: 'success' }));
      } else {
        setPromoError(result.message);
        dispatch(addToast({ message: result.message, type: 'error' }));
      }
    } catch {
      setPromoError('Could not validate coupon. Please try again.');
      dispatch(addToast({ message: 'Coupon validation failed.', type: 'error' }));
    }
  };

  const handleRemovePromo = () => {
    dispatch(removePromo());
    setPromoCode('');
    setPromoError('');
    dispatch(addToast({ message: 'Coupon removed.', type: 'info' }));
  };

  const handleQuantityChange = (item: any, newQty: number) => {
    if (newQty < 1) return;
    dispatch(updateQuantity({
      id: item.id,
      size: item.size,
      color: item.color,
      quantity: newQty
    }));
    dispatch(addToast({ message: `Updated quantity for ${item.title}`, type: 'info' }));
  };

  const handleRemoveItem = (item: any) => {
    dispatch(removeFromCart({
      id: item.id,
      size: item.size,
      color: item.color
    }));
    dispatch(addToast({ message: `${item.title} removed from bag`, type: 'info' }));
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-[#fcfbf9] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md w-full bg-white p-8 sm:p-12 rounded-3xl border border-gray-100 shadow-sm"
        >
          <div className="w-20 h-20 bg-[#f5f0eb] text-[#8b7b6b] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={36} className="stroke-[1.5]" />
          </div>
          <h2 className="text-2xl font-light text-[#1a1a1a] mb-3">Your Bag is Empty</h2>
          <p className="text-sm text-[#6b5b4b] mb-8 leading-relaxed">
            Choose from our premium selections and add some fresh confidence to your wardrobe.
          </p>
          <Link 
            href="/collections" 
            className="block w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbf9] py-8 sm:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <Link 
          href="/collections" 
          className="inline-flex items-center gap-2 text-[#6b5b4b] hover:text-[#1a1a1a] text-sm mb-6 sm:mb-8 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Continue Shopping
        </Link>

        <h1 className="text-3xl font-light tracking-tight text-[#1a1a1a] mb-8 sm:mb-12">
          Shopping Bag <span className="text-base text-gray-400 font-normal">({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 items-start">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {cartItems.map((item) => {
                const uniqueKey = `${item.id}-${item.size || ''}-${item.color || ''}`;
                return (
                  <motion.div
                    key={uniqueKey}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 rounded-2xl shadow-sm gap-4"
                  >
                    
                    {/* Item Details block */}
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-24 sm:w-24 sm:h-32 bg-[#f5f0eb] rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.1em] text-[#D4AF37] uppercase mb-1">
                          {item.brand}
                        </p>
                        <Link 
                          href={`/product/${item.slug}`} 
                          className="text-sm sm:text-base font-medium text-gray-800 hover:text-black line-clamp-1 mb-1.5 transition-colors"
                        >
                          {item.title}
                        </Link>
                        
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6b5b4b] mb-2">
                          {item.size && (
                            <span>Size: <strong className="text-gray-800">{item.size}</strong></span>
                          )}
                          {item.color && (
                            <span>Color: <strong className="text-gray-800">{item.color}</strong></span>
                          )}
                        </div>

                        {/* Price Details mobile only */}
                        <div className="sm:hidden flex items-baseline gap-2 mt-1">
                          <span className="text-sm font-bold text-gray-800">{formatPrice(item.discountedPrice)}</span>
                          {item.price > item.discountedPrice && (
                            <span className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Actions block */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      {/* Price desktop only */}
                      <div className="hidden sm:flex items-baseline gap-2 mb-2">
                        <span className="text-base font-bold text-gray-800">{formatPrice(item.discountedPrice)}</span>
                        {item.price > item.discountedPrice && (
                          <span className="text-xs text-gray-400 line-through">{formatPrice(item.price)}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quantity selector */}
                        <div className="flex items-center border border-gray-200 rounded-xl bg-white">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors rounded-l-xl"
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-gray-800">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="px-2.5 py-1.5 hover:bg-gray-50 text-gray-400 hover:text-black transition-colors rounded-r-xl"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          aria-label="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Checkout Summary panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Promo Code Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag size={16} className="text-[#8b7b6b]" />
                Promo / Coupon Code
              </h3>
              
              {appliedCode ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800 text-xs">
                    <Percent size={14} className="text-green-600" />
                    <span>Applied: <strong>{appliedCode}</strong></span>
                  </div>
                  <button 
                    onClick={handleRemovePromo}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="e.g. WELCOME10"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black uppercase placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
                  >
                    Apply
                  </button>
                </form>
              )}
              {promoError && (
                <p className="text-[10px] text-red-500 mt-2 font-medium">{promoError}</p>
              )}
              <div className="mt-3 text-[10px] text-gray-400 leading-normal">
                Tip: Use code <strong className="text-gray-500">WELCOME10</strong> (10% off), <strong className="text-gray-500">WEEKEND10</strong> (10% off), or <strong className="text-gray-500">FESTIVAL20</strong> (20% off).
              </div>
            </div>

            {/* Calculations Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-gray-800 pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-sm text-[#6b5b4b]">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="text-gray-800 font-medium">{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping Fee</span>
                  {shipping === 0 ? (
                    <span className="text-green-600 font-medium">FREE</span>
                  ) : (
                    <span className="text-gray-800 font-medium">{formatPrice(shipping)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (12%)</span>
                  <span className="text-gray-800 font-medium">{formatPrice(tax)}</span>
                </div>
              </div>

              {shipping > 0 && (
                <div className="bg-[#fcfbf9] border border-gray-100 rounded-xl p-3 text-[11px] text-[#6b5b4b] flex items-center gap-2 leading-relaxed">
                  <Truck size={14} className="text-[#8b7b6b] flex-shrink-0" />
                  <span>Add <strong className="text-gray-800">{formatPrice(2000 - subtotal)}</strong> more for free standard delivery.</span>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                <span className="text-base font-medium text-gray-800">Total Price</span>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal)}</span>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="block w-full py-4 bg-black text-white rounded-xl text-sm font-semibold uppercase tracking-wider hover:bg-gray-900 transition-colors shadow-md text-center pt-4"
              >
                Proceed to Checkout
              </button>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium">
                <ShieldCheck size={14} className="text-green-600" />
                <span>100% Secure Shopping Guarantee</span>
              </div>
            </div>

            {/* Support/Faq */}
            <div className="text-center text-xs text-gray-400">
              Need assistance? Email care@grstyles.com or call 1800-123-4567
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}