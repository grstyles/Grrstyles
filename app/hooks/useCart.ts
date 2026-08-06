'use client';

import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { addToCart, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { RootState } from '@/lib/redux/store';

interface AddToCartParams {
  id: string;
  slug: string;
  title: string;
  brand: string;
  price: number;
  discountedPrice: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  deliveryChargeEnabled?: boolean;
  deliveryCharge?: number;
  delivery_charge_enabled?: boolean;
  delivery_charge?: number;
}

export const useCart = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const cartItems = useSelector((state: RootState) => state.cart.items);

  const handleAddToCart = (params: AddToCartParams) => {
    const { size } = params;

    if (!size) {
      dispatch(addToast({ message: 'Please select a size first', type: 'error' }));
      return false;
    }

    const deliveryChargeEnabled = params.deliveryChargeEnabled ?? params.delivery_charge_enabled ?? false;
    const deliveryCharge = params.deliveryCharge ?? params.delivery_charge ?? 0;
    const couponApplicable = (params as any).couponApplicable !== false && (params as any).is_coupon_applicable !== false && (params as any).coupon_applicable !== false;

    dispatch(
      addToCart({
        id: params.id,
        slug: params.slug,
        title: params.title,
        brand: params.brand,
        price: params.price,
        discountedPrice: params.discountedPrice || params.price,
        image: params.image,
        quantity: params.quantity || 1,
        size: params.size,
        color: params.color,
        deliveryChargeEnabled,
        deliveryCharge,
        delivery_charge_enabled: deliveryChargeEnabled,
        delivery_charge: deliveryCharge,
        couponApplicable,
        is_coupon_applicable: couponApplicable,
        coupon_applicable: couponApplicable,
      })
    );

    dispatch(
      addToast({
        message: `${params.title} added to cart! 🛒`,
        type: 'success',
      })
    );

    return true;
  };

  const handleBuyNow = (params: AddToCartParams) => {
    const success = handleAddToCart(params);
    if (success) {
      router.push('/cart');
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.discountedPrice * item.quantity, 0);
  };

  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return {
    handleAddToCart,
    handleBuyNow,
    cartItems,
    getCartTotal,
    getCartItemCount,
  };
};