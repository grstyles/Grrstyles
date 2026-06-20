'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { repo } from '@/lib/repositories';
import { MockOrder } from '@/lib/providers/mockStore';
import { formatPrice } from '@/lib/utils/helpers';
import { User, Mail, MapPin, ClipboardList, LogOut, ArrowRight, Clock } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, requireAuth, logout } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Default mock saved addresses
  const savedAddresses = [
    {
      id: 'addr_1',
      label: 'Home',
      fullName: user?.fullName || 'Demo Customer',
      address: 'H-204, Beverly Hills, Phase 2, Lokhandwala',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400053',
      country: 'India',
      phone: '+91 98765 00101',
    },
    {
      id: 'addr_2',
      label: 'Office',
      fullName: user?.fullName || 'Demo Customer',
      address: 'Tech Hub Building, Unit 5B, Bandra Kurla Complex',
      city: 'Mumbai',
      state: 'Maharashtra',
      zip: '400051',
      country: 'India',
      phone: '+91 98765 00102',
    }
  ];

  useEffect(() => {
    requireAuth(
      () => {
        setAuthChecked(true);
      },
      () => {
        router.push('/');
      }
    );
  }, [requireAuth, router]);

  useEffect(() => {
    if (!authChecked) return;

    async function loadOrders() {
      const email = user?.email;
      if (!email) {
        setLoadingOrders(false);
        return;
      }
      try {
        const allOrders = await repo.orders.getAll();
        const userOrders = allOrders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
        setOrders(userOrders);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
  }, [authChecked, user]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      dispatch(addToast({ message: 'Logged out successfully.', type: 'info' }));
      router.push('/');
    }
  };

  if (!authChecked || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#fcfbfa]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase font-serif">Account Profile</h1>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Manage your personal settings and active history</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Profile Summary Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-black/5 bg-gray-50 flex items-center justify-center">
                <img
                  src={user.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=customer'}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{user.fullName}</h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
                  {user.role}
                </span>
              </div>
              <div className="w-full border-t border-gray-100 pt-4 text-left space-y-3">
                <div className="flex items-center gap-2.5 text-xs text-gray-500">
                  <Mail size={14} className="text-gray-400" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-gray-500">
                  <User size={14} className="text-gray-400" />
                  <span>ID: {user.id.slice(-8)}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 mt-2 py-3 border border-red-100 hover:border-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider text-red-500 rounded-2xl transition-all"
              >
                <LogOut size={13} />
                Sign Out
              </button>
            </div>

            {/* Quick Links Card */}
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Navigation</h4>
              <div className="flex flex-col gap-1">
                <Link
                  href="/orders"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <ClipboardList size={14} />
                    Order History
                  </span>
                  <ArrowRight size={12} className="text-gray-400" />
                </Link>
                <Link
                  href="/cart"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <User size={14} />
                    Shopping Cart
                  </span>
                  <ArrowRight size={12} className="text-gray-400" />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="md:col-span-2 space-y-6">
            {/* Orders summary */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList size={15} className="text-gray-400" />
                  Recent Orders
                </h3>
                <Link href="/orders" className="text-[10px] font-bold text-black hover:underline uppercase tracking-wider flex items-center gap-0.5">
                  View All ({orders.length}) <ArrowRight size={10} />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-2xl gap-3 hover:border-gray-300 transition-colors">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-900">{order.orderNumber}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                          <span>{order.date}</span>
                          <span>•</span>
                          <span>{order.itemsCount} Item{order.itemsCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                        <span className="text-xs font-bold text-gray-950">{formatPrice(order.totalAmount)}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                          order.status === 'Cancelled' ? 'bg-red-50 text-red-500' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <Clock size={20} className="mx-auto text-gray-300" />
                  <p className="text-xs text-gray-400">You haven&apos;t placed any orders yet.</p>
                  <Link href="/" className="inline-block text-[10px] font-bold text-black hover:underline uppercase tracking-wider">
                    Browse Catalog
                  </Link>
                </div>
              )}
            </div>

            {/* Saved addresses */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-5">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-3">
                <MapPin size={15} className="text-gray-400" />
                Saved Addresses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div key={addr.id} className="p-4 border border-gray-100 rounded-2xl space-y-2 flex flex-col justify-between">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">
                          {addr.label}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800">{addr.fullName}</p>
                      <p className="text-xs text-gray-500 font-light leading-relaxed truncate">{addr.address}</p>
                      <p className="text-[11px] text-gray-400 font-light">{addr.city}, {addr.state} - {addr.zip}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono pt-2 border-t border-gray-50">{addr.phone}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
