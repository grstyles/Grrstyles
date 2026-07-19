'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import { formatPrice } from '@/lib/utils/helpers';
import { calculateOrderTotals } from '@/lib/utils/shipping';
import { clearSelectedItems, setDirectCheckoutItem } from '@/lib/redux/slices/cartSlice';
import { repo, UserAddress } from '@/lib/repositories';
import { RAZORPAY_KEY_ID } from '@/lib/config';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useAuth } from '@/lib/context/AuthContext';
import { Package, CheckCircle, CreditCard, Smartphone } from 'lucide-react';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
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

  // ✅ Fixed: Added freeDelivery to initial state
  const [shippingConfig, setShippingConfig] = useState({
    shippingCharge: 100,
    freeShippingAbove: 2000,
    freeDelivery: false,
  });

  useEffect(() => {
    fetch('/api/admin/shipping')
      .then((res) => res.json())
      .then((cfg) => {
        setShippingConfig({
          shippingCharge: cfg.shippingCharge,
          freeShippingAbove: cfg.freeShippingAbove,
          freeDelivery: cfg.freeDelivery,
        });
      })
      .catch((err) => {
        console.error('Failed to load shipping settings in checkout:', err);
      });
  }, []);

  // ✅ Fixed: Use centralized calculateOrderTotals
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

  useEffect(() => {
    requireAuth(
      () => {
        setAuthChecked(true);
      },
      () => {
        router.push('/cart');
      }
    );
  }, [requireAuth, router]);

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
      const productIds = cartItems.map((item) => item.id);
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
      paymentMethod: paymentMethod,
      totalAmount: finalTotal,
      discountAmount: discount,
      couponCode: appliedPromo || null,
      paymentStatus: 'Pending',
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

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'GR STYLES',
          description: 'Menswear Fashion Checkout',
          order_id: rzpOrder.id,
          // UPI specific options
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
          },
          handler: async function (response: any) {
            try {
              console.log('Payment success, verifying...', response);
              
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
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
              
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                sessionStorage.setItem('gr_last_amount', finalTotal.toString());
              }
              
              if (directCheckoutItem) {
                dispatch(setDirectCheckoutItem(null));
              } else {
                dispatch(clearSelectedItems());
              }
              
              dispatch(addToast({ message: `Order ${verifyData.order_number} placed successfully!`, type: 'success' }));
              router.push('/order-success');
            } catch (err: any) {
              console.error('Verification error:', err);
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
            payment_type: 'upi'
          },
          theme: {
            color: '#000000',
          },
          modal: {
            ondismiss: function () {
              dispatch(addToast({ message: 'Payment cancelled.', type: 'info' }));
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response);
          dispatch(addToast({ message: 'Payment failed. Please try again.', type: 'error' }));
          setLoading(false);
        });
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

        const options = {
          key: RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'GR STYLES',
          description: 'Menswear Fashion Checkout',
          order_id: rzpOrder.id,
          handler: async function (response: any) {
            try {
              console.log('Payment success, verifying...', response);
              
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
              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
              
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('gr_last_payment_id', response.razorpay_payment_id);
                sessionStorage.setItem('gr_last_amount', finalTotal.toString());
              }
              
              if (directCheckoutItem) {
                dispatch(setDirectCheckoutItem(null));
              } else {
                dispatch(clearSelectedItems());
              }
              
              dispatch(addToast({ message: `Order ${verifyData.order_number} placed successfully!`, type: 'success' }));
              router.push('/order-success');
            } catch (err: any) {
              console.error('Verification error:', err);
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
              dispatch(addToast({ message: 'Payment cancelled.', type: 'info' }));
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          console.error('Payment failed:', response);
          dispatch(addToast({ message: 'Payment failed. Please try again.', type: 'error' }));
          setLoading(false);
        });
        rzp.open();
      } catch (err: any) {
        console.error('Card payment error:', err);
        dispatch(addToast({ message: err.message || 'Failed to initialize payment.', type: 'error' }));
        setLoading(false);
      }
    } else {
      // COD flow
      await handlePlaceOrder(orderPayload);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

              {/* Payment Method - UPI First */}
              <section className="border-b border-gray-200 pb-8">
                <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* UPI Option - First */}
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

                  {/* Credit/Debit Card Option - Second */}
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
              {cartItems.map((item) => {
                const uniqueKey = `${item.id}-${item.size || ''}-${item.shirtSize || ''}-${item.pantSize || ''}-${item.shoeSize || ''}-${item.color || ''}`;
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

            {/* ✅ Added: Free Delivery Status Message */}
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