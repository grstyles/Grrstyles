'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { repo, MockOrder, UserAddress } from '@/lib/repositories';
import { formatPrice } from '@/lib/utils/helpers';
import { 
  User, 
  Mail, 
  MapPin, 
  ClipboardList, 
  LogOut, 
  ArrowRight, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  X,
  ShoppingBag,
  Heart,
  Star,
  Award,
  Truck,
  RefreshCw,
  Headphones,
  Settings,
  Shield,
  Bell,
  Camera,
  Calendar,
  Package,
  Gift,
  CreditCard,
  Globe,
  Moon,
  FileText,
  MessageCircle,
  BarChart3,
  ChevronRight,
  Lock,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';
import BottomNavigation from '@/components/layout/BottomNavigation';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, requireAuth, logout } = useAuth();
  
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Supabase addresses state
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false
  });

  const loadAddresses = async () => {
    if (!user) return;
    setLoadingAddresses(true);
    try {
      const list = await repo.users.getAddresses(user.id);
      setAddresses(list);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    requireAuth(
      () => {
        setAuthChecked(true);
      },
      () => {
        router.push('/login');
      }
    );
  }, [requireAuth, router]);

  useEffect(() => {
    if (user) {
      setAuthChecked(true);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;

    async function loadOrders() {
      if (!user) {
        setLoadingOrders(false);
        return;
      }
      try {
        const userOrders = await repo.orders.getAll();
        setOrders(userOrders);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    }

    loadOrders();
    loadAddresses();
  }, [authChecked, user]);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      dispatch(addToast({ message: 'Logged out successfully.', type: 'info' }));
      router.push('/');
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: user?.fullName || '',
      phone: '',
      email: user?.email || '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefault: addresses.length === 0
    });
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: UserAddress) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      email: addr.email || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country,
      isDefault: addr.isDefault
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingAddress) {
        await repo.users.updateAddress(editingAddress.id, {
          ...addressForm,
          userId: user.id
        });
        dispatch(addToast({ message: 'Address updated successfully!', type: 'success' }));
      } else {
        await repo.users.addAddress({
          ...addressForm,
          userId: user.id
        });
        dispatch(addToast({ message: 'Address added successfully!', type: 'success' }));
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      loadAddresses();
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to save address', type: 'error' }));
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const success = await repo.users.deleteAddress(id);
      if (success) {
        dispatch(addToast({ message: 'Address deleted successfully!', type: 'success' }));
        loadAddresses();
      } else {
        throw new Error('Failed to delete address');
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to delete address', type: 'error' }));
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      const success = await repo.users.setDefaultAddress(id, user.id);
      if (success) {
        dispatch(addToast({ message: 'Default address updated!', type: 'success' }));
        loadAddresses();
      } else {
        throw new Error('Failed to update default address');
      }
    } catch (err: any) {
      dispatch(addToast({ message: err.message || 'Failed to set default address', type: 'error' }));
    }
  };

  const getMemberSince = (): string => {
    if (!user) return 'Recently';
    const date = (user as any)?.created_at || (user as any)?.createdAt;
    if (!date) return 'Recently';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return 'Recently';
    }
  };

  const memberSince = getMemberSince();

  const renderIcon = (IconComponent: any, className: string) => {
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  if (!authChecked || !user) {
    return (
      <>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#f8fafc]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500 font-medium">Loading your profile...</p>
          </div>
        </div>
        <BottomNavigation />
      </>
    );
  }

  const quickStats = [
    { icon: Package, label: 'Orders', value: orders.length, color: 'text-indigo-600' },
    { icon: Heart, label: 'Wishlist', value: 0, color: 'text-rose-500' },
    { icon: Star, label: 'Reviews', value: 0, color: 'text-amber-500' },
    { icon: Award, label: 'Points', value: 0, color: 'text-emerald-500' },
  ];

  const menuSections = [
    {
      title: 'Shopping',
      icon: ShoppingBag,
      items: [
        { icon: Package, label: 'Order History', href: '/orders', description: 'Track all your orders', badge: orders.length.toString(), color: 'text-indigo-600' },
        { icon: Truck, label: 'Track Orders', href: '/orders', description: 'Real-time delivery updates', color: 'text-blue-600' },
        { icon: RefreshCw, label: 'Returns & Exchanges', href: '/returns', description: 'Manage returns and refunds', color: 'text-amber-600' },
      ]
    },
    {
      title: 'Account Settings',
      icon: Settings,
      items: [
        { icon: User, label: 'Personal Information', href: '/profile/edit', description: 'Name, email, contact details', color: 'text-gray-700' },
        { icon: Shield, label: 'Security', href: '/profile/security', description: 'Password & 2FA', color: 'text-emerald-600' },
        { icon: Bell, label: 'Notifications', href: '/profile/notifications', description: 'Email & push preferences', color: 'text-amber-600' },
      ]
    },
    {
      title: 'Payments & Delivery',
      icon: CreditCard,
      items: [
        { icon: MapPin, label: 'Saved Addresses', href: '#addresses', description: 'Manage delivery addresses', badge: addresses.length.toString(), color: 'text-purple-600' },
        { icon: CreditCard, label: 'Payment Methods', href: '/profile/payments', description: 'Cards, UPI, wallets', color: 'text-emerald-600' },
        { icon: Gift, label: 'Gift Cards', href: '/profile/gift-cards', description: 'Redeem and manage vouchers', color: 'text-rose-500' },
      ]
    },
    {
      title: 'Support',
      icon: Headphones,
      items: [
        { icon: Headphones, label: 'Help & Support', href: '/profile/help', description: 'FAQs, contact support', color: 'text-indigo-600' },
        { icon: FileText, label: 'Legal & Privacy', href: '/profile/legal', description: 'Privacy policy, terms of use', color: 'text-gray-700' },
        { icon: MessageCircle, label: 'Feedback', href: '/profile/feedback', description: 'Share your experience', color: 'text-rose-500' },
      ]
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] pb-24">
        {/* Premium Header with Gradient */}
        <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 px-6 pt-12 pb-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -ml-40 -mb-40"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Profile Header */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-2 border-white/30 shadow-2xl ring-4 ring-white/10 overflow-hidden">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'user'}`}
                    alt={user?.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform duration-200 border border-gray-100">
                  <Camera className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">{user?.fullName || 'User'}</h1>
                  {user?.role === 'admin' && (
                    <span className="px-3 py-1 bg-amber-500/30 text-amber-200 text-[10px] font-semibold rounded-full border border-amber-500/40 backdrop-blur-sm">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Mail className="w-4 h-4 text-white/40" />
                  <p className="text-white/60 text-sm font-medium">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-white/40" />
                  <p className="text-white/40 text-xs font-medium">Member since {memberSince}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-2 hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="text-center group cursor-pointer">
                  <div className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300 mx-auto mb-2 group-hover:scale-110">
                    {renderIcon(stat.icon, `w-5 h-5 ${stat.color} group-hover:scale-110 transition-transform`)}
                  </div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/50 font-medium uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="max-w-6xl mx-auto px-4 -mt-5 relative z-10">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: ShoppingBag, label: 'Shop', href: '/search', gradient: 'from-indigo-500 to-purple-500' },
              { icon: Truck, label: 'Track', href: '/orders', gradient: 'from-blue-500 to-cyan-500' },
              { icon: MessageCircle, label: 'Support', href: '/profile/help', gradient: 'from-emerald-500 to-teal-500' },
              { icon: BarChart3, label: 'Analytics', href: '/profile/analytics', gradient: 'from-amber-500 to-orange-500' },
            ].map((action, idx) => (
              <Link key={idx} href={action.href} className="group">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    {renderIcon(action.icon, 'w-5 h-5 text-white')}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-100 shadow-lg">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'user'}`}
                      alt={user?.fullName || 'User'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{user?.fullName || 'User'}</h3>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full inline-block mt-1.5">
                      {user?.role || 'Customer'}
                    </span>
                  </div>
                  <div className="w-full border-t border-gray-100 pt-4 space-y-2.5">
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5">
                      <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="truncate font-medium">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-2.5">
                      <User className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <span className="font-mono text-xs">ID: {user?.id?.slice(-8) || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Navigation</h4>
                <div className="space-y-1">
                  {[
                    { icon: ClipboardList, label: 'Order History', href: '/orders' },
                    { icon: ShoppingBag, label: 'Shopping Cart', href: '/cart' },
                    { icon: Heart, label: 'Wishlist', href: '/wishlist' },
                  ].map((item, idx) => (
                    <Link
                      key={idx}
                      href={item.href}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 transition-all duration-200 group"
                    >
                      <span className="flex items-center gap-3 text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                        {renderIcon(item.icon, 'w-4 h-4 text-gray-400 group-hover:text-indigo-500')}
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Orders */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                      <ClipboardList className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Recent Orders</h3>
                  </div>
                  <Link href="/orders" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                    View All ({orders.length})
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {loadingOrders ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-3 mt-4">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-2xl gap-3 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200">
                        <div className="space-y-1.5">
                          <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{order.date}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span>{order.itemsCount} Item{order.itemsCount === 1 ? '' : 's'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <span className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                            order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                            order.status === 'Cancelled' ? 'bg-rose-50 text-rose-500 border border-rose-200' :
                            'bg-amber-50 text-amber-600 border border-amber-200'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">You haven't placed any orders yet</p>
                    <Link href="/search" className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                      Start Shopping →
                    </Link>
                  </div>
                )}
              </div>

              {/* Saved Addresses */}
              <div id="addresses" className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">Saved Addresses</h3>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {addresses.length}
                    </span>
                  </div>
                  <button
                    onClick={openAddAddress}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors bg-purple-50 px-4 py-2 rounded-xl hover:bg-purple-100"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add New
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="py-12 flex justify-center">
                    <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-5 border border-gray-100 rounded-2xl space-y-3 hover:border-purple-200 hover:shadow-md transition-all duration-200 relative group">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-800">{addr.fullName}</p>
                              {addr.isDefault && (
                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-2.5 h-2.5" /> Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-xs text-gray-400">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-xs text-gray-400">{addr.country}</p>
                            <p className="text-xs text-gray-400 font-mono">{addr.phone}</p>
                            {addr.email && <p className="text-xs text-gray-400 truncate">{addr.email}</p>}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => openEditAddress(addr)}
                              className="text-gray-400 hover:text-indigo-600 p-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Address"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Address"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-[10px] font-semibold text-gray-400 hover:text-purple-600 transition-colors flex items-center gap-1.5 bg-gray-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg w-full justify-center"
                          >
                            <CheckCircle className="w-3 h-3" /> Set as Default
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <MapPin className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-500">No saved addresses yet</p>
                    <button
                      onClick={openAddAddress}
                      className="inline-block text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                    >
                      Add Your First Address →
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Sections */}
              {menuSections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                    <div className="p-2 bg-gray-50 rounded-xl">
                      {renderIcon(section.icon, 'w-5 h-5 text-gray-700')}
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
                  </div>
                  
                  <div className="divide-y divide-gray-50 mt-2">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="flex items-center gap-4 px-3 py-3.5 hover:bg-gray-50/80 rounded-2xl transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <div className="p-2.5 rounded-xl bg-gray-50 group-hover:bg-white transition-colors shadow-sm group-hover:shadow-md">
                            {renderIcon(item.icon, `w-4 h-4 ${item.color || 'text-gray-600'} group-hover:scale-110 transition-transform`)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal - Enhanced */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingAddress ? 'Update your delivery address details' : 'Enter your delivery address details'}
              </p>
            </div>
            
            <form onSubmit={handleSaveAddress} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="+91 7386489584"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                  Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Street address, P.O. Box, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Apartment, suite, unit, building, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="400053"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                    Country <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="India"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 font-medium hover:text-indigo-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>Set as Default Address</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-2xl text-sm font-semibold transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation />
    </>
  );
}