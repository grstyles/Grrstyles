'use client';

import React, { useEffect, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from '@/lib/redux/store';
import { hydrateCart, CartItem } from '@/lib/redux/slices/cartSlice';
import { hydrateWishlist } from '@/lib/redux/slices/wishlistSlice';
import { syncService } from '@/services/syncService';
import { productService } from '@/services/productService';
import ToastContainer from '@/components/ui/ToastContainer';
import { AuthProvider, useAuth } from '@/lib/context/AuthContext';

function DbSyncHydrator({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);
  
  const isHydrated = useRef(false);
  const prevCartItemsRef = useRef<CartItem[]>([]);
  const prevWishlistRef = useRef<any[]>([]);
  
  const { user } = useAuth();
  const userId = user?.id || null;

  // 2. Load Cart from localStorage on mount (hydration step 1)
  useEffect(() => {
    const savedCart = localStorage.getItem('gr_styles_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          dispatch(hydrateCart(parsed));
          prevCartItemsRef.current = parsed;
        }
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
    isHydrated.current = true;
  }, [dispatch]);

  // 3. Sync local Redux states with DB on user change (login/logout)
  useEffect(() => {
    if (!userId) return;

    const performSyncOnLogin = async () => {
      // Cart Merge
      const dbCart = await syncService.fetchDbCart(userId);
      const mergedCart = [...dbCart];

      for (const localItem of cartItems) {
        const dbIdx = mergedCart.findIndex((db) => db.id === localItem.id && db.size === localItem.size);
        if (dbIdx !== -1) {
          mergedCart[dbIdx].quantity = Math.max(mergedCart[dbIdx].quantity, localItem.quantity);
        } else {
          mergedCart.push(localItem);
        }
      }

      // Upsert merged items to DB
      for (const item of mergedCart) {
        await syncService.syncCartItem(userId, item);
      }

      dispatch(hydrateCart(mergedCart));
      prevCartItemsRef.current = mergedCart;
      localStorage.setItem('gr_styles_cart', JSON.stringify(mergedCart));

      // Wishlist Hydration
      const dbWishlistIds = await syncService.fetchDbWishlist(userId);
      if (dbWishlistIds.length > 0) {
        const wishlistItemsToLoad = [];
        for (const id of dbWishlistIds) {
          const prod = await productService.getProductBySlug(id);
          if (prod) {
            wishlistItemsToLoad.push({
              id: prod.id,
              slug: prod.slug,
              title: prod.name,
              brand: prod.brand,
              price: prod.mrpPrice,
              discountedPrice: prod.sellingPrice,
              image: prod.images?.[0] || '/placeholder.png'
            });
          }
        }
        dispatch(hydrateWishlist(wishlistItemsToLoad));
        prevWishlistRef.current = wishlistItemsToLoad;
      }
    };

    performSyncOnLogin();
  }, [userId]);

  // 4. Track and Sync changes to Cart
  useEffect(() => {
    if (!isHydrated.current) return;

    // Local Storage backup
    localStorage.setItem('gr_styles_cart', JSON.stringify(cartItems));

    if (!userId) {
      prevCartItemsRef.current = cartItems;
      return;
    }

    const syncCartWithDb = async () => {
      const prevCart = prevCartItemsRef.current;

      // Check for clears
      if (cartItems.length === 0 && prevCart.length > 0) {
        await syncService.clearCart(userId);
      } else {
        // Upsert new or changed quantities
        for (const item of cartItems) {
          const prevItem = prevCart.find(
            (p) => p.id === item.id && p.size === item.size
          );
          if (!prevItem || prevItem.quantity !== item.quantity) {
            await syncService.syncCartItem(userId, item);
          }
        }

        // Delete removed items
        for (const prevItem of prevCart) {
          const stillExists = cartItems.some(
            (item) => item.id === prevItem.id && item.size === prevItem.size
          );
          if (!stillExists) {
            await syncService.removeCartItem(userId, prevItem.id, prevItem.size);
          }
        }
      }

      prevCartItemsRef.current = cartItems;
    };

    syncCartWithDb();
  }, [cartItems, userId]);

  // 5. Track and Sync changes to Wishlist
  useEffect(() => {
    if (!userId) {
      prevWishlistRef.current = wishlistItems;
      return;
    }

    const syncWishlistWithDb = async () => {
      const prevWish = prevWishlistRef.current;

      // Add newly wishlisted items
      for (const item of wishlistItems) {
        if (!prevWish.some((p) => p.id === item.id)) {
          await syncService.addToWishlist(userId, item.id);
        }
      }

      // Delete removed wishlist items
      for (const prevItem of prevWish) {
        if (!wishlistItems.some((item) => item.id === prevItem.id)) {
          await syncService.removeFromWishlist(userId, prevItem.id);
        }
      }

      prevWishlistRef.current = wishlistItems;
    };

    syncWishlistWithDb();
  }, [wishlistItems, userId]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        <DbSyncHydrator>
          {children}
          <ToastContainer />
        </DbSyncHydrator>
      </AuthProvider>
    </Provider>
  );
}

