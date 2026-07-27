'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  MapPin,
  Heart,
  Activity,
  Shield,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CustomerDetail } from '@/lib/repositories/interfaces';
import { customerService } from '@/services/customerService';
import Link from 'next/link';

interface CustomerDetailModalProps {
  customerId: string | null;
  onClose: () => void;
}

export default function CustomerDetailModal({ customerId, onClose }: CustomerDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'wishlist' | 'activity'>('overview');

  useEffect(() => {
    if (!customerId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    customerService
      .getCustomerDetail(customerId)
      .then((data) => {
        if (isMounted) {
          if (data) {
            setCustomer(data);
          } else {
            setError('Customer profile details could not be found.');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load customer details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [customerId]);

  if (!customerId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-sm transition-opacity duration-300">
      <div
        className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 border-l border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FAF9F6]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-md uppercase font-serif">
              {customer?.avatar ? (
                <img
                  src={customer.avatar}
                  alt={customer.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                customer?.name?.charAt(0) || 'C'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-serif font-bold text-gray-900">{customer?.name || 'Loading...'}</h2>
                {customer?.accountStatus === 'Admin' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                    Admin
                  </span>
                )}
                {customer?.accountStatus === 'Registered' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Registered
                  </span>
                )}
                {customer?.accountStatus === 'Guest' && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    Guest
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {customer?.id || customerId}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center p-12">
            <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Fetching Customer Profile...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <X size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Error Loading Customer</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-5 py-2 bg-black text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition-colors"
            >
              Close Window
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && customer && (
          <>
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-4 gap-3 p-6 bg-white border-b border-gray-100">
              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Total Spent</p>
                <p className="text-base font-serif font-bold text-gray-900 mt-1">
                  ₹{(customer.totalSpent || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Total Orders</p>
                <p className="text-base font-serif font-bold text-gray-900 mt-1">{customer.totalOrders || 0}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Avg Order Value</p>
                <p className="text-base font-serif font-bold text-gray-900 mt-1">
                  ₹{(customer.avgOrderValue || 0).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Status</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      customer.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-gray-900">{customer.status}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'orders', label: `Orders (${customer.orders.length})`, icon: ShoppingBag },
                { id: 'addresses', label: `Addresses (${customer.addresses.length})`, icon: MapPin },
                { id: 'wishlist', label: `Wishlist (${customer.wishlist.length})`, icon: Heart },
                { id: 'activity', label: 'Activity', icon: Activity },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'border-black text-black'
                        : 'border-transparent text-gray-400 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Contact Info Card */}
                  <div className="bg-gray-50/60 rounded-2xl p-5 border border-gray-100 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                          <User size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Full Name</p>
                          <p className="text-xs font-bold text-gray-900">{customer.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                          <Mail size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Email Address</p>
                          <p className="text-xs font-bold text-gray-900 truncate">{customer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                          <Phone size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Phone Number</p>
                          <p className="text-xs font-bold text-gray-900">{customer.phone || 'Not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                          <Calendar size={15} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase font-medium">Registration Date</p>
                          <p className="text-xs font-bold text-gray-900">{customer.registrationDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Orders Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Recent Orders ({customer.orders.length})
                      </h3>
                      {customer.orders.length > 0 && (
                        <button
                          onClick={() => setActiveTab('orders')}
                          className="text-xs font-bold text-black hover:underline flex items-center gap-1 uppercase tracking-wider"
                        >
                          View All <ChevronRight size={12} />
                        </button>
                      )}
                    </div>

                    {customer.orders.length === 0 ? (
                      <div className="p-8 bg-gray-50/60 rounded-2xl text-center border border-gray-100">
                        <ShoppingBag size={24} className="mx-auto text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-500">No orders placed yet</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">This customer has not completed any purchases.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customer.orders.slice(0, 3).map((order) => (
                          <div
                            key={order.id}
                            className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono text-gray-900">
                                  #{order.orderNumber}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : order.status === 'Cancelled'
                                      ? 'bg-red-50 text-red-600 border border-red-200'
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400">
                                {order.date} • {order.itemsCount} items
                              </p>
                            </div>

                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className="text-xs font-bold text-gray-900">
                                  ₹{order.totalAmount.toLocaleString('en-IN')}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">{order.paymentStatus}</p>
                              </div>
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-xl transition-colors"
                                title="View order details"
                              >
                                <ExternalLink size={14} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {customer.orders.length === 0 ? (
                    <div className="p-12 bg-gray-50/60 rounded-2xl text-center border border-gray-100">
                      <ShoppingBag size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-600">No Orders Found</p>
                      <p className="text-xs text-gray-400 mt-1">This customer has zero order transactions.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customer.orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-5 bg-white rounded-2xl border border-gray-100 hover:shadow-sm transition-shadow space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold font-mono text-gray-900">
                                  #{order.orderNumber}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    order.status === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                      : order.status === 'Cancelled'
                                      ? 'bg-red-50 text-red-600 border border-red-200'
                                      : 'bg-amber-50 text-amber-600 border border-amber-200'
                                  }`}
                                >
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">Placed on {order.date}</p>
                            </div>

                            <div className="text-right">
                              <p className="text-base font-serif font-bold text-gray-900">
                                ₹{order.totalAmount.toLocaleString('en-IN')}
                              </p>
                              <p className="text-[10px] uppercase font-bold text-emerald-600">{order.paymentStatus}</p>
                            </div>
                          </div>

                          {/* Items summary */}
                          {order.items && order.items.length > 0 && (
                            <div className="pt-3 border-t border-gray-100 space-y-1.5">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-gray-600">
                                  <span>
                                    {item.productName} <span className="text-gray-400">({item.size})</span> × {item.quantity}
                                  </span>
                                  <span className="font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="pt-2 flex justify-end">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="text-xs font-semibold text-black hover:underline flex items-center gap-1 uppercase tracking-wider"
                            >
                              View Full Order <ChevronRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Saved Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-3">
                  {customer.addresses.length === 0 ? (
                    <div className="p-12 bg-gray-50/60 rounded-2xl text-center border border-gray-100">
                      <MapPin size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-600">No Saved Addresses</p>
                      <p className="text-xs text-gray-400 mt-1">This customer has not added any addresses yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {customer.addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className="p-5 bg-white rounded-2xl border border-gray-100 relative hover:border-gray-300 transition-colors"
                        >
                          {addr.isDefault && (
                            <span className="absolute top-4 right-4 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black text-white">
                              Default Address
                            </span>
                          )}

                          <p className="text-xs font-bold text-gray-900">{addr.fullName}</p>
                          <p className="text-xs text-gray-600 mt-1">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-xs text-gray-600">{addr.addressLine2}</p>}
                          <p className="text-xs text-gray-600">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          <p className="text-xs text-gray-600">{addr.country}</p>

                          {addr.phone && (
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 font-mono">
                              <Phone size={12} /> {addr.phone}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Wishlist */}
              {activeTab === 'wishlist' && (
                <div className="space-y-3">
                  {customer.wishlist.length === 0 ? (
                    <div className="p-12 bg-gray-50/60 rounded-2xl text-center border border-gray-100">
                      <Heart size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-600">Wishlist is Empty</p>
                      <p className="text-xs text-gray-400 mt-1">No items currently saved to wishlist.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {customer.wishlist.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 hover:border-gray-300 transition-colors"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ShoppingBag size={16} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.productName}</p>
                            <p className="text-xs font-serif font-bold text-gray-900 mt-0.5">
                              ₹{item.price.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[9px] text-gray-400">Added {item.addedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 5: Recent Activity */}
              {activeTab === 'activity' && (
                <div className="space-y-4">
                  {customer.activity.length === 0 ? (
                    <div className="p-12 bg-gray-50/60 rounded-2xl text-center border border-gray-100">
                      <Activity size={28} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-bold text-gray-600">No Activity Logs</p>
                    </div>
                  ) : (
                    <div className="relative pl-6 border-l border-gray-200 space-y-6 my-2">
                      {customer.activity.map((act) => (
                        <div key={act.id} className="relative">
                          {/* Dot */}
                          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-black flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          </div>

                          <div>
                            <p className="text-xs font-bold text-gray-900">{act.description}</p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{act.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
