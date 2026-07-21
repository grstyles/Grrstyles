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
  Lock
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
        // RLS policy on the orders table already filters rows to the logged-in
        // user (via customer_email = auth.jwt()->>'email'), so getAll() returns
        // only this user's orders — no client-side filter needed.
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

  // Helper function to get member since date safely
  const getMemberSince = (): string => {
    if (!user) return 'Recently';
    
    // Try different possible date fields
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

  // Helper function to render icons safely
  const renderIcon = (IconComponent: any, className: string) => {
    if (!IconComponent) return null;
    return <IconComponent className={className} />;
  };

  if (!authChecked || !user) {
    return (
      <>
        <div className="min-h-[70vh] flex items-center justify-center bg-[#fcfbfa]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading your profile...</p>
          </div>
        </div>
        <BottomNavigation />
      </>
    );
  }

  const quickStats = [
    { icon: Package, label: 'Orders', value: orders.length },
    { icon: Heart, label: 'Wishlist', value: 0 },
    { icon: Star, label: 'Reviews', value: 0 },
    { icon: Award, label: 'Points', value: 0 },
  ];

  const menuSections = [
    {
      title: 'Order Management',
      icon: ClipboardList,
      items: [
        { icon: Package, label: 'Order History', href: '/orders', description: 'Track all your orders', badge: orders.length.toString() },
        { icon: Truck, label: 'Track Orders', href: '/orders', description: 'Real-time delivery updates' },
        { icon: RefreshCw, label: 'Returns & Exchanges', href: '/returns', description: 'Manage returns and refunds' },
      ]
    },
    {
      title: 'Account & Security',
      icon: Shield,
      items: [
        { icon: User, label: 'Personal Information', href: '/profile/edit', description: 'Name, email, contact details' },
        { icon: Lock, label: 'Security Settings', href: '/profile/security', description: 'Password, 2FA, devices' },
        { icon: Bell, label: 'Notifications', href: '/profile/notifications', description: 'Email & push preferences' },
      ]
    },
    {
      title: 'Payment & Shipping',
      icon: CreditCard,
      items: [
        { icon: MapPin, label: 'Saved Addresses', href: '#addresses', description: 'Manage delivery addresses', badge: addresses.length.toString() },
        { icon: CreditCard, label: 'Payment Methods', href: '/profile/payments', description: 'Cards, UPI, wallets' },
        { icon: Gift, label: 'Gift Cards & Vouchers', href: '/profile/gift-cards', description: 'Redeem and manage vouchers' },
      ]
    },
    {
      title: 'Preferences & Support',
      icon: Settings,
      items: [
        { icon: Globe, label: 'Language & Region', href: '/profile/language', description: 'Currency, timezone, language' },
        { icon: Moon, label: 'Theme Preferences', href: '/profile/theme', description: 'Dark mode, accessibility' },
        { icon: Headphones, label: 'Help & Support', href: '/profile/help', description: 'FAQs, contact support' },
        { icon: FileText, label: 'Terms & Privacy', href: '/profile/legal', description: 'Privacy policy, terms of use' },
      ]
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] pb-24">
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 px-6 pt-12 pb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -ml-20 -mb-20"></div>
          
          <div className="max-w-5xl mx-auto relative z-10">
            {/* Profile Header */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border-2 border-white/20 shadow-xl ring-4 ring-black/20 overflow-hidden">
                  <img
                    src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'user'}`}
                    alt={user?.fullName || 'User'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-3.5 h-3.5 text-gray-700" />
                </button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{user?.fullName || 'User'}</h1>
                  {user?.role === 'admin' && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded-full border border-amber-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/60 text-sm">{user?.email}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-3.5 h-3.5 text-white/40" />
                  <p className="text-white/40 text-xs">Member since {memberSince}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
              {quickStats.map((stat, idx) => (
                <div key={idx} className="text-center group cursor-pointer">
                  <div className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors mx-auto mb-1.5">
                    {renderIcon(stat.icon, "w-4 h-4 text-white/70 group-hover:text-white transition-colors")}
                  </div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-white/40 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="max-w-5xl mx-auto px-4 -mt-3 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 grid grid-cols-4 gap-2">
            {[
              { icon: ShoppingBag, label: 'Shop Now', href: '/search', color: 'text-black' },
              { icon: Truck, label: 'Track Order', href: '/orders', color: 'text-blue-600' },
              { icon: MessageCircle, label: 'Chat Support', href: '/profile/help', color: 'text-green-600' },
              { icon: BarChart3, label: 'Analytics', href: '/profile/analytics', color: 'text-purple-600' },
            ].map((action, idx) => (
              <Link key={idx} href={action.href} className="flex flex-col items-center gap-1 py-2 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className={`p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors`}>
                  {renderIcon(action.icon, `w-4 h-4 ${action.color}`)}
                </div>
                <span className="text-[10px] text-gray-600 font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Profile Summary Card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-black/5 bg-gray-50">
                    <img
                      src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.email || 'user'}`}
                      alt={user?.fullName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{user?.fullName || 'User'}</h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full inline-block mt-1">
                      {user?.role || 'Customer'}
                    </span>
                  </div>
                  <div className="w-full border-t border-gray-100 pt-3 text-left space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-gray-500">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <span>ID: {user?.id?.slice(-8) || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 mt-2 py-3 border border-red-100 hover:border-red-600 hover:bg-red-50 text-xs font-semibold uppercase tracking-wider text-red-500 rounded-xl transition-all"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-3">Quick Navigation</h4>
                <div className="flex flex-col gap-1">
                  <Link href="/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors">
                    <span className="flex items-center gap-2.5">
                      <ClipboardList size={14} />
                      Order History
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                  <Link href="/cart" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors">
                    <span className="flex items-center gap-2.5">
                      <ShoppingBag size={14} />
                      Shopping Cart
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                  <Link href="/wishlist" className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-700 hover:text-black transition-colors">
                    <span className="flex items-center gap-2.5">
                      <Heart size={14} />
                      Wishlist
                    </span>
                    <ArrowRight size={12} className="text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Orders */}
              <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
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
                  <div className="space-y-3 mt-4">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-gray-100 rounded-xl gap-3 hover:border-gray-300 transition-colors">
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
                    <p className="text-xs text-gray-400">You haven't placed any orders yet.</p>
                    <Link href="/search" className="inline-block text-[10px] font-bold text-black hover:underline uppercase tracking-wider">
                      Start Shopping
                    </Link>
                  </div>
                )}
              </div>

              {/* Saved Addresses */}
              <div id="addresses" className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={15} className="text-gray-400" />
                    Saved Addresses ({addresses.length})
                  </h3>
                  <button
                    onClick={openAddAddress}
                    className="flex items-center gap-1 text-[10px] font-bold text-black hover:underline uppercase tracking-wider"
                  >
                    <Plus size={12} /> Add New
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="py-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-4 border border-gray-100 rounded-xl space-y-2 hover:border-gray-300 transition-colors relative">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-800">{addr.fullName}</p>
                            <p className="text-xs text-gray-500 font-light leading-relaxed">
                              {addr.addressLine1}
                              {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                            </p>
                            <p className="text-[11px] text-gray-400 font-light">{addr.city}, {addr.state} - {addr.pincode}</p>
                            <p className="text-[11px] text-gray-400 font-light">{addr.country}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{addr.phone}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditAddress(addr)}
                              className="text-gray-400 hover:text-black p-1 transition-colors"
                              title="Edit Address"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                              title="Delete Address"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                          {addr.isDefault ? (
                            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                              Default
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              className="text-[9px] font-bold text-gray-400 hover:text-black uppercase tracking-widest bg-gray-50 hover:bg-gray-100 border border-gray-100 px-2.5 py-0.5 rounded-full transition-colors"
                            >
                              Set as Default
                            </button>
                          )}
                          {addr.email && <p className="text-[9px] text-gray-400 truncate max-w-[120px]">{addr.email}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <MapPin size={20} className="mx-auto text-gray-300" />
                    <p className="text-xs text-gray-400">You don't have any saved addresses.</p>
                    <button
                      onClick={openAddAddress}
                      className="inline-block text-[10px] font-bold text-black hover:underline uppercase tracking-wider"
                    >
                      Add Your First Address
                    </button>
                  </div>
                )}
              </div>

              {/* Menu Sections */}
              {menuSections.map((section, idx) => (
                <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 pb-4 border-b border-gray-50">
                    {renderIcon(section.icon, "w-4 h-4 text-gray-400")}
                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                      {section.title}
                    </h3>
                    <div className="flex-1"></div>
                  </div>
                  
                  <div className="divide-y divide-gray-50 mt-2">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        href={item.href}
                        className="flex items-center gap-3 px-2 py-3 hover:bg-gray-50/80 rounded-xl transition-all duration-200 group"
                      >
                        <div className="flex-shrink-0">
                          <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
                            {renderIcon(item.icon, "w-4 h-4 text-gray-600 group-hover:text-black transition-colors")}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 group-hover:text-black transition-colors">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-black/5 text-black/60 text-[10px] font-semibold rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-400 truncate">{item.description}</p>
                          )}
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black transition-colors flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddressModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold font-serif text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-3">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            
            <form onSubmit={handleSaveAddress} className="space-y-4 text-left">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. 7386489584"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="e.g. customer@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address Line 1 *</label>
                <input
                  type="text"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Street address, P.O. Box, etc."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address Line 2</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">City *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. Mumbai"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. Maharashtra"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. 400053"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Country *</label>
                  <input
                    type="text"
                    required
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-black transition-colors"
                    placeholder="e.g. India"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={addressForm.isDefault}
                      onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                      className="w-4 h-4 accent-black rounded focus:ring-black"
                    />
                    <span>Set as Default Address</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-black hover:bg-gray-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors"
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
