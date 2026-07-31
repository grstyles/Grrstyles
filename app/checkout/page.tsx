'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { formatPrice } from '@/lib/utils/helpers';
import { calculateOrderTotals, calculateTotalSavings } from '@/lib/utils/shipping';
import { clearSelectedItems, setDirectCheckoutItem, removePromo, applyPromo } from '@/lib/redux/slices/cartSlice';
import { repo, UserAddress } from '@/lib/repositories';
import { RAZORPAY_KEY_ID } from '@/lib/config';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useAuth } from '@/lib/context/AuthContext';
import { autoApplyBestCoupon } from '@/lib/utils/couponHelper';
import { Package, CheckCircle, CreditCard, Smartphone, Tag, Sparkles, X, RefreshCw, Banknote } from 'lucide-react';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const directCheckoutItem = useSelector((state: RootState) => state.cart.directCheckoutItem);
  const cartItemsAll = useSelector((state: RootState) => state.cart.items);
  const cartItems = directCheckoutItem ? [directCheckoutItem] : cartItemsAll.filter((item) => item.selected !== false);
  const total = cartItems.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const paymentStateRef = useRef<'IDLE' | 'OPENED' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');

  // iOS-safe fallback: stores the active Razorpay order context so that
  // visibility/focus events can trigger server-side status checks.
  const iosFallbackContextRef = useRef<{
    razorpay_order_id: string;
    orderPayload: any;
    items: any[];
    finalTotal: number;
  } | null>(null);

  // Prevents running the fallback more than once per order.
  const verifiedOrderIdsRef = useRef<Set<string>>(new Set());

  // Mutex so parallel focus/visibility events don't double-fire.
  const isFallbackRunningRef = useRef(false);

  // ── iOS-safe fallback verification ────────────────────────────────────────
  // On iOS, returning from PhonePe / Google Pay does NOT reliably fire the
  // Razorpay handler() callback.  We listen for page-visibility / pageshow /
  // focus events and, if a payment is in-flight (state === 'OPENED'), we poll
  // the server for the captured payment status.
  const runIosFallback = useCallback(async (source: string) => {
    // Only act when the checkout is waiting for a UPI app
    if (paymentStateRef.current !== 'OPENED') return;

    const ctx = iosFallbackContextRef.current;
    if (!ctx) return;

    // Prevent duplicate concurrent runs
    if (isFallbackRunningRef.current) return;
    if (verifiedOrderIdsRef.current.has(ctx.razorpay_order_id)) return;

    isFallbackRunningRef.current = true;
    console.log(`[iOS-fallback] Returned from payment app (${source})`)
    console.log('[iOS-fallback] Starting fallback verification for order', ctx.razorpay_order_id);

    try {
      const res = await fetch('/api/razorpay/check-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: ctx.razorpay_order_id,
          userId: user?.id,
          orderPayload: ctx.orderPayload,
          items: ctx.items,
        }),
      });

      const data = await res.json();

      if (data.captured) {
        console.log('[iOS-fallback] Payment captured — completing order', data);
        verifiedOrderIdsRef.current.add(ctx.razorpay_order_id);
        paymentStateRef.current = 'SUCCESS';

        sessionStorage.setItem('gr_last_amount', ctx.finalTotal.toString());
        if (data.order_number || data.order_id) {
          sessionStorage.setItem('gr_last_order_number', data.order_number || data.order_id);
        }
        if (data.razorpay_payment_id) {
          sessionStorage.setItem('gr_last_payment_id', data.razorpay_payment_id);
        }

        // Clear context so subsequent events are no-ops
        iosFallbackContextRef.current = null;

        if (directCheckoutItem) {
          dispatch(setDirectCheckoutItem(null));
        } else {
          dispatch(clearSelectedItems());
        }
        dispatch(addToast({ message: `Order ${data.order_number || ''} placed successfully!`, type: 'success' }));
        console.log('[iOS-fallback] Order completed — redirecting to success');
        router.push('/order-success');
      } else {
        console.log('[iOS-fallback] Payment not yet completed — will retry on next event');
      }
    } catch (err) {
      console.warn('[iOS-fallback] Status check error:', err);
    } finally {
      isFallbackRunningRef.current = false;
      // Always clear the loading spinner if the fallback resolves without success
      if (paymentStateRef.current !== 'SUCCESS') {
        // leave loading=true so the spinner stays — Razorpay modal is still visible
        // (we only clear it when we know the payment failed or was cancelled)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, directCheckoutItem, dispatch, router]);

  useEffect(() => {
    // Prefetch target pages on mount so routing is instant on mobile and desktop
    router.prefetch('/order-success');
    router.prefetch('/payment-failed');

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('[STEP 5] Page visibility changed to hidden (app switch to PhonePe)');
      } else {
        console.log('[STEP 6] Page visibility restored to visible (returned from PhonePe)', { state: paymentStateRef.current });
        runIosFallback('visibilitychange');
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      console.log('[STEP 18] Page show event triggered', { persisted: e.persisted, state: paymentStateRef.current });
      runIosFallback('pageshow');
    };

    const handleFocus = () => {
      runIosFallback('focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, runIosFallback]);

  useEffect(() => {
    if (authChecked && user) {
      const loadAddresses = async () => {
        setLoadingAddresses(true);
        try {
          const list = await repo.users.getAddresses(user.id);
          setAddresses(list);
          const defaultAddr = list.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            selectAddress(defaultAddr);
          } else if (list.length > 0) {
            setSelectedAddressId(list[0].id);
            selectAddress(list[0]);
          } else {
            setSelectedAddressId('new');
          }
        } catch (err) {
          console.error('Failed to load saved addresses:', err);
        } finally {
          setLoadingAddresses(false);
        }
      };
      loadAddresses();
    }
  }, [authChecked, user]);

  const selectAddress = (addr: UserAddress) => {
    const names = addr.fullName.trim().split(/\s+/);
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';
    
    setFormData({
      firstName,
      lastName,
      email: addr.email || user?.email || '',
      phone: addr.phone,
      alternatePhone: '',
      address: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : ''),
      city: addr.city,
      state: addr.state,
      zip: addr.pincode,
      country: addr.country,
    });
  };

  const handleSelectAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    if (id === 'new') {
      setFormData({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phone: '',
        alternatePhone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
      });
    } else {
      const addr = addresses.find((a) => a.id === id);
      if (addr) selectAddress(addr);
    }
  };

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const discountValue = useSelector((state: RootState) => state.cart.discountValue);
  const discountType = useSelector((state: RootState) => state.cart.discountType);
  const appliedPromo = useSelector((state: RootState) => state.cart.appliedPromo);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponStatusMsg, setCouponStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = couponInput.toUpperCase().trim();
    if (!cleanCode) {
      setCouponStatusMsg({ text: 'Please enter a coupon code.', type: 'error' });
      return;
    }

    setApplyingCoupon(true);
    setCouponStatusMsg(null);

    try {
      const productIds = cartItems.flatMap((item) => [item.id, item.slug, item.sku].filter(Boolean) as string[]);
      const valRes = await repo.coupons.apply(cleanCode, { subtotal: total, productIds });

      if (valRes.valid) {
        dispatch(applyPromo({
          code: cleanCode,
          discountValue: valRes.discountValue,
          discountType: valRes.discountType === 'percentage' ? 'percentage' : 'flat',
        }));
        setCouponStatusMsg({ text: `🎉 Coupon Applied Successfully!`, type: 'success' });
        dispatch(addToast({ message: `🎉 Coupon "${cleanCode}" applied successfully!`, type: 'success' }));
        setCouponInput('');
      } else {
        dispatch(removePromo());
        setCouponStatusMsg({ text: valRes.message, type: 'error' });
        dispatch(addToast({ message: valRes.message, type: 'error' }));
      }
    } catch (err: any) {
      setCouponStatusMsg({ text: err?.message || 'Invalid coupon code.', type: 'error' });
      dispatch(addToast({ message: err?.message || 'Invalid coupon code.', type: 'error' }));
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Standalone Auto-Apply Best Coupon Effect on Checkout load
  useEffect(() => {
    if (!appliedPromo && cartItems.length > 0 && total > 0) {
      autoApplyBestCoupon(cartItems, total, dispatch, user?.id, user?.email);
    }
  }, [appliedPromo, cartItems, total, user, dispatch]);

  // Shipping config — initialise with freeDelivery=true (show ₹0) until the
  // API responds.  The real values overwrite this inside the useEffect below.
  const [shippingConfig, setShippingConfig] = useState({
    shippingCharge: 80,
    freeShippingAbove: 2000,
    freeDelivery: false,
    codEnabled: true, // default true until API responds
  });

  useEffect(() => {
    fetch('/api/shipping')
      .then((res) => {
        if (!res.ok) {
          console.warn(`[Checkout] /api/shipping returned HTTP ${res.status}, using default shipping config.`);
          return null;
        }
        return res.json();
      })
      .then((cfg) => {
        if (!cfg) return;
        console.log('[Checkout] Raw /api/shipping response:', cfg);

        // Validate that the response contains the expected camelCase fields.
        if (
          cfg.shippingCharge === undefined ||
          cfg.freeShippingAbove === undefined ||
          cfg.freeDelivery === undefined
        ) {
          console.error(
            '[Checkout] ⚠️  /api/shipping response is missing expected camelCase fields.' +
            ' Got:', JSON.stringify(cfg)
          );
        }

        setShippingConfig({
          shippingCharge: Number(cfg.shippingCharge ?? 80),
          freeShippingAbove: Number(cfg.freeShippingAbove ?? 2000),
          freeDelivery: Boolean(cfg.freeDelivery ?? false),
          codEnabled: cfg.codEnabled !== undefined ? Boolean(cfg.codEnabled) : true,
        });

        // If COD was selected but admin has disabled it, reset to UPI
        if (!cfg.codEnabled && paymentMethod === 'cod') {
          setPaymentMethod('upi');
        }

        console.log('[Checkout] ✅ shippingConfig updated:', {
          shippingCharge: Number(cfg.shippingCharge ?? 80),
          freeShippingAbove: Number(cfg.freeShippingAbove ?? 2000),
          freeDelivery: Boolean(cfg.freeDelivery ?? false),
          codEnabled: cfg.codEnabled !== undefined ? Boolean(cfg.codEnabled) : true,
        });
      })
      .catch((err) => {
        console.warn('[Checkout] Failed to load shipping settings:', err);
      });
  }, []);

  const discount = discountType === 'percentage' 
    ? Math.round((total * discountValue) / 100) 
    : discountValue;

  const totals = calculateOrderTotals(
    cartItems,
    shippingConfig,
    discount
  );

  const shipping = totals.shipping;
  const tax = totals.tax;
  const finalTotal = totals.total;

  const totalSavings = calculateTotalSavings(cartItems, discount);

  // Auth gate: wait for auth to finish loading, then check if user exists
  useEffect(() => {
    if (authLoading) return; // wait for auth to resolve

    if (user) {
      setAuthChecked(true);
    } else {
      // Not logged in — redirect to login page
      router.push('/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

  // 10-second timeout safeguard — ensures the spinner never stays forever
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!authChecked) {
        console.error('Checkout initialization timed out.');
        setInitError('Checkout took too long to load. Please refresh the page.');
        setAuthChecked(true); // unblock the spinner
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [authChecked]);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        firstName: prev.firstName || user.fullName.split(' ')[0] || '',
        lastName: prev.lastName || user.fullName.split(' ').slice(1).join(' ') || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Load Razorpay SDK dynamically on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ((window as any).Razorpay) {
        setRazorpayLoaded(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('✅ Razorpay SDK Loaded');
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay SDK');
        dispatch(addToast({
          message: 'Failed to load payment SDK. Please refresh and try again.',
          type: 'error'
        }));
      };
      document.body.appendChild(script);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (orderPayload: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/cod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderPayload,
          cartItems,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (data.success && data.orderNumber) {
        sessionStorage.setItem('gr_last_order_number', data.orderNumber);
        sessionStorage.setItem('gr_last_amount', finalTotal.toString());
        // Store payment method so the success page can show COD messaging
        sessionStorage.setItem('gr_last_payment_method', 'cod');
        if (directCheckoutItem) {
          dispatch(setDirectCheckoutItem(null));
        } else {
          dispatch(clearSelectedItems());
        }
        dispatch(addToast({ message: `Order ${data.orderNumber} placed successfully!`, type: 'success' }));
        router.push('/order-success');
      } else {
        dispatch(addToast({ message: data.error || 'Failed to create order. Please try again.', type: 'error' }));
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Order registration failed.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (appliedPromo) {
      const productIds = cartItems.flatMap((item) => [item.id, item.slug, item.sku].filter(Boolean) as string[]);
      const valRes = await repo.coupons.apply(appliedPromo, { subtotal: total, productIds });
      if (!valRes.valid) {
        dispatch(addToast({ message: valRes.message, type: 'error' }));
        setLoading(false);
        return;
      }
    }

    if (selectedAddressId === 'new' && saveAddressToProfile && user) {
      try {
        await repo.users.addAddress({
          userId: user.id,
          fullName: `${formData.firstName} ${formData.lastName}`.trim(),
          phone: formData.phone,
          email: formData.email,
          addressLine1: formData.address,
          addressLine2: '',
          city: formData.city,
          state: formData.state,
          pincode: formData.zip,
          country: formData.country,
          isDefault: addresses.length === 0
        });
        setSaveAddressToProfile(false);
      } catch (err) {
        console.error('Failed to auto-save address to profile:', err);
      }
    }

    const addressString = `${formData.address}, ${formData.city}, ${formData.state} - ${formData.zip}, ${formData.country}`;
    const orderPayload = {
      customerName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
      alternatePhone: formData.alternatePhone,
      shippingAddress: {
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        fullAddressString: addressString
      },
      // Map internal method names: upi/card both go through razorpay gateway;
      // cod is stored as 'cod'. This value is written to the DB.
      paymentMethod: paymentMethod === 'cod' ? 'cod' : 'razorpay',
      totalAmount: finalTotal,
      discountAmount: discount,
      couponCode: appliedPromo || null,
      paymentStatus: paymentMethod === 'cod' ? 'Pending' : 'Paid',
    };

    // If UPI is selected, use UPI flow
    if (paymentMethod === 'upi') {
      // UPI payment flow
      setLoading(true);
      
      // Check if Razorpay is loaded
      if (!razorpayLoaded || !(window as any).Razorpay) {
        dispatch(addToast({ 
          message: 'Razorpay SDK is still loading. Please try again in a moment.', 
          type: 'error' 
        }));
        setLoading(false);
        return;
      }

      // Check if Razorpay Key ID is configured properly
      if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes('placeholder') || RAZORPAY_KEY_ID.includes('demo')) {
        dispatch(addToast({ 
          message: 'Razorpay Key ID is not configured. Please define NEXT_PUBLIC_RAZORPAY_KEY_ID in your .env.local file.', 
          type: 'error' 
        }));
        setLoading(false);
        return;
      }

      try {
        console.log('[STEP 1] Razorpay order creation requested', { amount: finalTotal });
        const createOrderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map(i => ({ 
              productId: i.id, 
              quantity: i.quantity,
              size: i.size || i.shirtSize || i.pantSize || i.shoeSize || null,
              color: i.color || null
            })),
            couponCode: appliedPromo || null,
            customerName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            userId: user?.id,
            shippingAddress: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
              country: formData.country,
              fullAddressString: addressString
            }
          }),
        });

        const rzpOrder = await createOrderRes.json();
        
        if (!createOrderRes.ok) {
          throw new Error(rzpOrder.error || 'Failed to initialize payment');
        }

        console.log('[STEP 2] Razorpay order created successfully', { id: rzpOrder.id, amount: rzpOrder.amount });
        paymentStateRef.current = 'OPENED';

        // Store context for the iOS-safe fallback (visibility/focus events)
        iosFallbackContextRef.current = {
          razorpay_order_id: rzpOrder.id,
          orderPayload,
          items: cartItems,
          finalTotal,
        };

        console.log('[STEP 3] Razorpay checkout options configured for UPI');

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'GR STYLES',
          description: 'Menswear Fashion Checkout',
          order_id: rzpOrder.id,
          config: {
            display: {
              hide: [
                { method: 'netbanking' },
                { method: 'wallet' }
              ]
            }
          },
          handler: async function (response: any) {
            console.log('[STEP 7] Razorpay handler() callback entered', response);
            paymentStateRef.current = 'VERIFYING';

            // Clear iOS fallback context — handler has fired so fallback is not needed
            iosFallbackContextRef.current = null;
            verifiedOrderIdsRef.current.add(response.razorpay_order_id);

            console.log('[STEP 8] Payment verification payload prepared');
            console.log('[STEP 9] verify-payment API request initiated');

            try {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user?.id,
                  orderPayload,
                  items: cartItems
                }),
              });

              const verifyData = await verifyRes.json();
              console.log('[STEP 10] verify-payment API response received', verifyData);

              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }

              console.log('[STEP 11] Payment status verified as SUCCESS');
              paymentStateRef.current = 'SUCCESS';

              if (typeof window !== 'undefined') {
                sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                sessionStorage.setItem('gr_last_amount', finalTotal.toString());
                if (verifyData.order_number || verifyData.order_id) {
                  sessionStorage.setItem('gr_last_order_number', verifyData.order_number || verifyData.order_id);
                }
              }
              console.log('[STEP 12] Session storage updated with payment/order data');

              if (directCheckoutItem) {
                dispatch(setDirectCheckoutItem(null));
              } else {
                dispatch(clearSelectedItems());
              }
              console.log('[STEP 13] Cart cleared post payment success');

              dispatch(addToast({ message: `Order ${verifyData.order_number || ''} placed successfully!`, type: 'success' }));
              console.log('[STEP 14] Redirecting to order success page');
              console.log('[STEP 20] Final payment outcome resolved as SUCCESS');
              router.push('/order-success');
            } catch (err: any) {
              console.warn('[STEP 17] Catch block entered during payment verification', err);

              // [STEP 18] Fallback database order check before triggering failure
              console.log('[STEP 18] Fallback database order check initiated');
              try {
                const checkRes = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: user?.id,
                    orderPayload,
                    items: cartItems
                  }),
                });
                const checkData = await checkRes.json();

                if (checkRes.ok && checkData.success) {
                  console.log('[STEP 19] Fallback database order found - redirecting to success', checkData);
                  paymentStateRef.current = 'SUCCESS';
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                    sessionStorage.setItem('gr_last_amount', finalTotal.toString());
                    if (checkData.order_number || checkData.order_id) {
                      sessionStorage.setItem('gr_last_order_number', checkData.order_number || checkData.order_id);
                    }
                  }
                  if (directCheckoutItem) {
                    dispatch(setDirectCheckoutItem(null));
                  } else {
                    dispatch(clearSelectedItems());
                  }
                  dispatch(addToast({ message: `Order ${checkData.order_number || ''} placed successfully!`, type: 'success' }));
                  console.log('[STEP 20] Final payment outcome resolved as SUCCESS (via Fallback)');
                  router.push('/order-success');
                  return;
                }
              } catch (fallbackErr) {
                console.error('Fallback DB check error:', fallbackErr);
              }

              paymentStateRef.current = 'FAILED';
              console.log('[STEP 20] Final payment outcome resolved as FAILED');
              dispatch(addToast({ message: err.message || 'Payment Verification Failed.', type: 'error' }));
              router.push('/payment-failed');
            } finally {
              // Always clear loading state — ensures spinner never gets stuck
              if (paymentStateRef.current !== 'SUCCESS') {
                setLoading(false);
              }
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            address: addressString,
            payment_type: 'upi'
          },
          theme: {
            color: '#000000',
          },
          modal: {
            ondismiss: function () {
              console.log('[STEP 15] Razorpay modal.ondismiss event triggered', { state: paymentStateRef.current });
              // On iOS, ondismiss fires when the user is redirected to the UPI app.
              // Do NOT cancel the flow if state === 'OPENED' — the visibility/focus
              // fallback will handle completion when the user returns.
              if (
                paymentStateRef.current !== 'VERIFYING' &&
                paymentStateRef.current !== 'SUCCESS' &&
                paymentStateRef.current !== 'OPENED'
              ) {
                dispatch(addToast({ message: 'Payment cancelled.', type: 'info' }));
                setLoading(false);
                iosFallbackContextRef.current = null;
                paymentStateRef.current = 'IDLE';
              } else if (paymentStateRef.current === 'OPENED') {
                // iOS: modal dismissed while OPENED — could be user switching to UPI app.
                // The fallback (visibilitychange / focus) will handle this.
                console.log('[iOS-fallback] ondismiss with OPENED state — awaiting visibility/focus fallback');
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        
        rzp.on('payment.failed', function (response: any) {
          console.log('[STEP 16] Razorpay payment.failed event triggered', { response, state: paymentStateRef.current });
          if (paymentStateRef.current !== 'VERIFYING' && paymentStateRef.current !== 'SUCCESS') {
            const errorMsg = response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.';
            dispatch(addToast({ message: errorMsg, type: 'error' }));
            setLoading(false);
            iosFallbackContextRef.current = null;
            paymentStateRef.current = 'FAILED';
          }
        });
        
        console.log('[STEP 4] Razorpay checkout modal opened');
        rzp.open();
      } catch (err: any) {
        console.error('UPI Error:', err);
        dispatch(addToast({ message: err.message || 'Failed to initialize UPI payment.', type: 'error' }));
        setLoading(false);
      }
    } else if (paymentMethod === 'card') {
      // Card payment flow
      setLoading(true);
      
      if (!razorpayLoaded || !(window as any).Razorpay) {
        dispatch(addToast({ 
          message: 'Razorpay SDK is still loading. Please try again in a moment.', 
          type: 'error' 
        }));
        setLoading(false);
        return;
      }

      if (!RAZORPAY_KEY_ID || RAZORPAY_KEY_ID.includes('placeholder') || RAZORPAY_KEY_ID.includes('demo')) {
        dispatch(addToast({ 
          message: 'Razorpay Key ID is not configured. Please define NEXT_PUBLIC_RAZORPAY_KEY_ID in your .env.local file.', 
          type: 'error' 
        }));
        setLoading(false);
        return;
      }

      try {
        console.log('[STEP 1] Razorpay order creation requested for Card', { amount: finalTotal });
        const createOrderRes = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cartItems.map(i => ({ 
              productId: i.id, 
              quantity: i.quantity,
              size: i.size || i.shirtSize || i.pantSize || i.shoeSize || null,
              color: i.color || null
            })),
            couponCode: appliedPromo || null,
            customerName: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            userId: user?.id,
            shippingAddress: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
              country: formData.country,
              fullAddressString: addressString
            }
          }),
        });

        const rzpOrder = await createOrderRes.json();
        
        if (!createOrderRes.ok) {
          throw new Error(rzpOrder.error || 'Failed to initialize payment');
        }

        console.log('[STEP 2] Razorpay order created successfully', { id: rzpOrder.id, amount: rzpOrder.amount });
        paymentStateRef.current = 'OPENED';

        console.log('[STEP 3] Razorpay checkout options configured for Card');

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'GR STYLES',
          description: 'Menswear Fashion Checkout',
          order_id: rzpOrder.id,
          handler: async function (response: any) {
            console.log('[STEP 7] Razorpay handler() callback entered', response);
            paymentStateRef.current = 'VERIFYING';

            console.log('[STEP 8] Payment verification payload prepared');
            console.log('[STEP 9] verify-payment API request initiated');

            try {
              const verifyRes = await fetch('/api/razorpay/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  userId: user?.id,
                  orderPayload,
                  items: cartItems
                }),
              });

              const verifyData = await verifyRes.json();
              console.log('[STEP 10] verify-payment API response received', verifyData);

              if (!verifyRes.ok || !verifyData.success) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }

              console.log('[STEP 11] Payment status verified as SUCCESS');
              paymentStateRef.current = 'SUCCESS';

              if (typeof window !== 'undefined') {
                sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                sessionStorage.setItem('gr_last_amount', finalTotal.toString());
                if (verifyData.order_number || verifyData.order_id) {
                  sessionStorage.setItem('gr_last_order_number', verifyData.order_number || verifyData.order_id);
                }
              }
              console.log('[STEP 12] Session storage updated with payment/order data');

              if (directCheckoutItem) {
                dispatch(setDirectCheckoutItem(null));
              } else {
                dispatch(clearSelectedItems());
              }
              console.log('[STEP 13] Cart cleared post payment success');

              dispatch(addToast({ message: `Order ${verifyData.order_number || ''} placed successfully!`, type: 'success' }));
              console.log('[STEP 14] Redirecting to order success page');
              console.log('[STEP 20] Final payment outcome resolved as SUCCESS');
              router.push('/order-success');
            } catch (err: any) {
              console.warn('[STEP 17] Catch block entered during payment verification', err);

              // [STEP 18] Fallback database order check before triggering failure
              console.log('[STEP 18] Fallback database order check initiated');
              try {
                const checkRes = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    userId: user?.id,
                    orderPayload,
                    items: cartItems
                  }),
                });
                const checkData = await checkRes.json();

                if (checkRes.ok && checkData.success) {
                  console.log('[STEP 19] Fallback database order found - redirecting to success', checkData);
                  paymentStateRef.current = 'SUCCESS';
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                    sessionStorage.setItem('gr_last_amount', finalTotal.toString());
                    if (checkData.order_number || checkData.order_id) {
                      sessionStorage.setItem('gr_last_order_number', checkData.order_number || checkData.order_id);
                    }
                  }
                  if (directCheckoutItem) {
                    dispatch(setDirectCheckoutItem(null));
                  } else {
                    dispatch(clearSelectedItems());
                  }
                  dispatch(addToast({ message: `Order ${checkData.order_number || ''} placed successfully!`, type: 'success' }));
                  console.log('[STEP 20] Final payment outcome resolved as SUCCESS (via Fallback)');
                  router.push('/order-success');
                  return;
                }
              } catch (fallbackErr) {
                console.error('Fallback DB check error:', fallbackErr);
              }

              paymentStateRef.current = 'FAILED';
              console.log('[STEP 20] Final payment outcome resolved as FAILED');
              dispatch(addToast({ message: err.message || 'Payment Verification Failed.', type: 'error' }));
              router.push('/payment-failed');
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone,
          },
          notes: {
            address: addressString,
          },
          theme: {
            color: '#000000',
          },
          modal: {
            ondismiss: function () {
              console.log('[STEP 15] Razorpay modal.ondismiss event triggered', { state: paymentStateRef.current });
              if (paymentStateRef.current !== 'VERIFYING' && paymentStateRef.current !== 'SUCCESS') {
                dispatch(addToast({ message: 'Payment cancelled.', type: 'info' }));
                setLoading(false);
                paymentStateRef.current = 'IDLE';
              }
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.log('[STEP 16] Razorpay payment.failed event triggered', { response, state: paymentStateRef.current });
          if (paymentStateRef.current !== 'VERIFYING' && paymentStateRef.current !== 'SUCCESS') {
            const errorMsg = response?.error?.description || response?.error?.reason || 'Payment failed. Please try again.';
            dispatch(addToast({ message: errorMsg, type: 'error' }));
            setLoading(false);
            paymentStateRef.current = 'FAILED';
          }
        });
        console.log('[STEP 4] Razorpay checkout modal opened');
        rzp.open();
      } catch (err: any) {
        console.error('Card payment error:', err);
        dispatch(addToast({ message: err.message || 'Failed to initialize payment.', type: 'error' }));
        setLoading(false);
      }
    } else {
      // COD flow — no Razorpay involved at all
      await handlePlaceOrder(orderPayload);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading checkout...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-600 font-semibold text-center">{initError}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12">
          <h1 className="text-4xl font-bold mb-8">Checkout</h1>
          <div className="text-center py-16">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <Link href="/" className="inline-block bg-black text-white px-8 py-3 rounded-lg font-bold hover:bg-gray-800">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-10 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Shipping Information */}
              <section className="border-b border-gray-200 pb-8">
                <h2 className="text-2xl font-bold mb-6">Shipping Information</h2>

                {addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select a Saved Address</label>
                    <select
                      value={selectedAddressId}
                      onChange={handleSelectAddressChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black appearance-none cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {addresses.map((addr) => (
                        <option key={addr.id} value={addr.id}>
                          {addr.fullName} - {addr.addressLine1}, {addr.city} ({addr.isDefault ? 'Default' : 'Saved'})
                        </option>
                      ))}
                      <option value="new">+ Enter New Address</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black md:col-span-2"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black md:col-span-1"
                  />
                  <input
                    type="tel"
                    name="alternatePhone"
                    placeholder="Alternate Phone (Optional)"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black md:col-span-1"
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Street Address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black md:col-span-2"
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State/Province"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <input
                    type="text"
                    name="zip"
                    placeholder="Pincode"
                    value={formData.zip}
                    onChange={handleChange}
                    required
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  />
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-black"
                  >
                    <option>India</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>United Arab Emirates</option>
                    <option>Canada</option>
                  </select>
                  
                  {selectedAddressId === 'new' && user && (
                    <div className="md:col-span-2 flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="save-address"
                        checked={saveAddressToProfile}
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                        className="w-4 h-4 accent-black rounded focus:ring-black cursor-pointer"
                      />
                      <label htmlFor="save-address" className="text-xs text-gray-600 cursor-pointer select-none">
                        Save this address to my profile for future purchases
                      </label>
                    </div>
                  )}
                </div>
              </section>

              {/* Payment Method - UPI First, Card Second, COD Third */}
              <section className="border-b border-gray-200 pb-8">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPI Option */}
                  <label 
                    className={`relative flex items-center p-5 rounded-xl cursor-pointer transition-all duration-300 transform ${
                      paymentMethod === 'upi' 
                        ? 'border-2 border-green-500 bg-green-50 shadow-md scale-[1.02]' 
                        : 'border border-gray-200 hover:border-green-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4 w-full">
                      <div className={`p-3 rounded-full ${paymentMethod === 'upi' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        <Smartphone size={24} />
                      </div>
                      <div className="flex-1">
                        <span className={`block font-bold ${paymentMethod === 'upi' ? 'text-green-800' : 'text-gray-800'}`}>UPI</span>
                        <span className="block text-sm text-gray-500 mt-0.5">Google Pay / PhonePe / Paytm</span>
                      </div>
                      {paymentMethod === 'upi' && (
                        <CheckCircle size={24} className="text-green-500 absolute top-5 right-5" />
                      )}
                    </div>
                  </label>

                  {/* Credit/Debit Card Option */}
                  <label 
                    className={`relative flex items-center p-5 rounded-xl cursor-pointer transition-all duration-300 transform ${
                      paymentMethod === 'card' 
                        ? 'border-2 border-blue-500 bg-blue-50 shadow-md scale-[1.02]' 
                        : 'border border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-4 w-full">
                      <div className={`p-3 rounded-full ${paymentMethod === 'card' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-1">
                        <span className={`block font-bold ${paymentMethod === 'card' ? 'text-blue-800' : 'text-gray-800'}`}>Credit / Debit Card</span>
                        <span className="block text-sm text-gray-500 mt-0.5">Visa, MasterCard, RuPay</span>
                      </div>
                      {paymentMethod === 'card' && (
                        <CheckCircle size={24} className="text-blue-500 absolute top-5 right-5" />
                      )}
                    </div>
                  </label>

                  {/* Cash on Delivery Option — only shown when admin enables it */}
                  {shippingConfig.codEnabled && (
                    <label 
                      className={`relative flex items-center p-5 rounded-xl cursor-pointer transition-all duration-300 transform md:col-span-2 ${
                        paymentMethod === 'cod' 
                          ? 'border-2 border-amber-500 bg-amber-50 shadow-md scale-[1.01]' 
                          : 'border border-gray-200 hover:border-amber-300 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className="flex items-center gap-4 w-full">
                        <div className={`p-3 rounded-full ${paymentMethod === 'cod' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                          <Banknote size={24} />
                        </div>
                        <div className="flex-1">
                          <span className={`block font-bold ${paymentMethod === 'cod' ? 'text-amber-800' : 'text-gray-800'}`}>Cash on Delivery</span>
                          <span className="block text-sm text-gray-500 mt-0.5">Pay when your order is delivered</span>
                        </div>
                        {paymentMethod === 'cod' && (
                          <CheckCircle size={24} className="text-amber-500 absolute top-5 right-5" />
                        )}
                      </div>
                    </label>
                  )}
                </div>
              </section>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-6 rounded-lg h-fit sticky top-24">
            <h3 className="text-2xl font-bold mb-6">Order Summary</h3>

            {/* Items */}
            <div className="mb-6 max-h-64 overflow-y-auto space-y-3">
              {cartItems.map((item, index) => {
                const uniqueKey = `${item.id}-${item.size || ''}-${item.shirtSize || ''}-${item.pantSize || ''}-${item.shoeSize || ''}-${item.color || ''}-${index}`;
                return (
                  <div key={uniqueKey} className="flex gap-4 text-sm pb-3 border-b border-gray-200 items-start group">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded-lg border border-gray-100 shrink-0 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
                        <Package size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 space-y-0.5">
                      <p className="font-medium text-gray-800 leading-tight">{item.title}</p>
                      <p className="text-[11px] text-gray-400">
                        Qty: {item.quantity} {item.size ? `| Size: ${item.size}` : ''} {item.shirtSize ? `| Shirt: ${item.shirtSize}` : ''} {item.pantSize ? `| Pant: ${item.pantSize}` : ''} {item.shoeSize ? `| Shoe: ${item.shoeSize}` : ''} {item.color ? `| Color: ${item.color}` : ''}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-800 shrink-0">{formatPrice(item.discountedPrice * item.quantity)}</span>
                  </div>
                );
              })}
            </div>

            {/* Manual Coupon Entry Form */}
            <div className="mb-4 space-y-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter Coupon Code"
                  className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:border-black placeholder:normal-case placeholder:font-normal placeholder-gray-400 bg-white"
                />
                <button
                  type="submit"
                  disabled={applyingCoupon || !couponInput.trim()}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50 shrink-0"
                >
                  {applyingCoupon ? 'Applying...' : 'Apply Coupon'}
                </button>
              </form>

              {couponStatusMsg && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    couponStatusMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium'
                      : 'bg-red-50 text-red-700 border border-red-200 font-medium'
                  }`}
                >
                  {couponStatusMsg.type === 'success' ? <Tag size={14} className="text-emerald-600 shrink-0" /> : <X size={14} className="text-red-500 shrink-0" />}
                  <span>{couponStatusMsg.text}</span>
                </div>
              )}
            </div>

            {/* Applied Coupon Display Card */}
            {appliedPromo && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    <Tag size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                      <span>Applied Coupon:</span>
                      <span className="font-mono font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                        {appliedPromo}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        🎉 Saved {formatPrice(discount)} on this order
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      autoApplyBestCoupon(cartItems, total, dispatch, user?.id, user?.email);
                    }}
                    className="px-2.5 py-1 text-[10px] font-bold text-gray-700 hover:text-black bg-white hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center gap-1 transition shadow-2xs"
                    title="Change / Re-evaluate Coupon"
                  >
                    <RefreshCw size={11} />
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      dispatch(removePromo());
                      setCouponStatusMsg(null);
                      dispatch(addToast({ message: 'Coupon removed from checkout.', type: 'info' }));
                    }}
                    className="p-1 text-red-600 hover:text-red-800 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition shadow-2xs"
                    title="Remove Coupon"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 border-t border-gray-200 pt-6">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 font-semibold">
                  <span>Discount ({appliedPromo})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-600 font-semibold">FREE</span>
                ) : (
                  <span className="text-gray-800 font-medium">{formatPrice(shipping)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-3">
                <span>Total</span>
                <span>{formatPrice(finalTotal)}</span>
              </div>
            </div>

            {/* You Saved on This Order Section */}
            {totalSavings > 0 && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold flex items-center gap-3 shadow-xs">
                <span className="text-xl shrink-0">🎉</span>
                <p className="text-sm font-bold text-green-800">
                  You saved <span className="font-extrabold">{formatPrice(totalSavings)}</span> on this order!
                </p>
              </div>
            )}

            {/* Free Delivery Status Message */}
            {shippingConfig.freeDelivery && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✅ Free Delivery is enabled. No shipping charges applied.
                </p>
              </div>
            )}
            {!shippingConfig.freeDelivery && shipping === 0 && total > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✅ Free Shipping Applied (Order above ₹{shippingConfig.freeShippingAbove})
                </p>
              </div>
            )}
            {!shippingConfig.freeDelivery && shipping > 0 && (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600">
                  Add ₹{formatPrice(shippingConfig.freeShippingAbove - total)} more for free shipping.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}