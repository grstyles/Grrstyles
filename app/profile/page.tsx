'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { repo, MockOrder, UserAddress } from '@/lib/repositories';
import { formatPrice } from '@/lib/utils/helpers';
import { User, Mail, MapPin, ClipboardList, LogOut, ArrowRight, Clock, Plus, Trash2, Edit, CheckCircle, X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addToast } from '@/lib/redux/slices/uiSlice';

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
              <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={15} className="text-gray-400" />
                  Saved Addresses
                </h3>
                <button
                  onClick={openAddAddress}
                  className="flex items-center gap-1 text-[10px] font-bold text-black hover:underline uppercase tracking-wider"
                >
                  <Plus size={12} /> Add New Address
                </button>
              </div>

              {loadingAddresses ? (
                <div className="py-8 flex justify-center">
                  <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                </div>
              ) : addresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="p-5 border border-gray-100 rounded-2xl space-y-3 flex flex-col justify-between hover:border-gray-300 transition-colors">
                      <div className="space-y-1 relative">
                        <div className="flex justify-between items-center mb-2">
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
                          <div className="flex items-center gap-2">
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
                        <p className="text-xs font-bold text-gray-800">{addr.fullName}</p>
                        <p className="text-xs text-gray-500 font-light leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-[11px] text-gray-400 font-light">{addr.city}, {addr.state} - {addr.pincode}</p>
                        <p className="text-[11px] text-gray-400 font-light">{addr.country}</p>
                      </div>
                      <div className="pt-2 border-t border-gray-50 flex flex-col gap-1 text-[10px] text-gray-400 font-mono">
                        <p>{addr.phone}</p>
                        {addr.email && <p className="truncate">{addr.email}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <MapPin size={20} className="mx-auto text-gray-300" />
                  <p className="text-xs text-gray-400">You don&apos;t have any saved addresses.</p>
                  <button
                    onClick={openAddAddress}
                    className="inline-block text-[10px] font-bold text-black hover:underline uppercase tracking-wider"
                  >
                    Add Your First Address
                  </button>
                </div>
              )}
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
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
