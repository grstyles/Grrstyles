'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { repo } from '@/lib/repositories';
import { MockOrder, MockOrderItem } from '@/lib/providers/mockStore';
import { formatPrice } from '@/lib/utils/helpers';
import { ClipboardList, ChevronDown, ChevronUp, Package, Clock, Truck, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function OrdersPage() {
  const router = useRouter();
  const { user, requireAuth } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
        setLoading(false);
        return;
      }
      try {
        const allOrders = await repo.orders.getAll();
        const userOrders = allOrders.filter((o) => o.email.toLowerCase() === email.toLowerCase());
        setOrders(userOrders);
        if (userOrders.length > 0) {
          setExpandedOrderId(userOrders[0].id);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [authChecked, user]);

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const getTimelineSteps = (status: MockOrder['status']) => {
    const steps = [
      { label: 'Pending', desc: 'Order placed, awaiting approval', icon: Clock },
      { label: 'Confirmed', desc: 'Payment verified, preparing item', icon: CheckCircle2 },
      { label: 'Packed', desc: 'Item packed at warehouse', icon: Package },
      { label: 'Shipped', desc: 'Handed to delivery partner', icon: Truck },
      { label: 'Delivered', desc: 'Delivered to destination', icon: CheckCircle2 },
    ];

    const currentIdx = steps.findIndex((s) => s.label === status);
    
    // Handle edge cases like Cancelled or Returned
    if (status === 'Cancelled') {
      return [
        { label: 'Pending', active: true, done: true, desc: 'Order placed', icon: Clock },
        { label: 'Cancelled', active: true, done: false, desc: 'Order was cancelled', icon: AlertTriangle, error: true },
      ];
    }
    if (status === 'Returned') {
      return [
        { label: 'Delivered', active: true, done: true, desc: 'Delivered to destination', icon: CheckCircle2 },
        { label: 'Returned', active: true, done: false, desc: 'Order returned by customer', icon: AlertTriangle },
      ];
    }

    return steps.map((step, idx) => ({
      ...step,
      active: idx <= currentIdx,
      done: idx < currentIdx,
    }));
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-black transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={12} /> Back to Profile
          </Link>
        </div>

        {/* Header */}
        <div className="mb-10 flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-2xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-tight text-gray-905 uppercase font-serif">Order History</h1>
            <p className="text-xs text-gray-400 mt-0.5">Track shipping progress and review past invoices</p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const timeline = getTimelineSteps(order.status);
              
              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow transition-shadow"
                >
                  {/* Header summary section */}
                  <div
                    onClick={() => toggleExpandOrder(order.id)}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {order.orderNumber}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-light">
                        <span>Date: {order.date}</span>
                        <span>•</span>
                        <span>{order.itemsCount} Item{order.itemsCount === 1 ? '' : 's'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-5">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Amount</p>
                        <p className="text-sm font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                          order.status === 'Cancelled' ? 'bg-red-50 text-red-500' :
                          order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {order.status}
                        </span>
                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section (Details + Timeline) */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 px-6 py-6 space-y-8 bg-gray-50/20">
                      
                      {/* Timeline status track */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Shipping Progress</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
                          {timeline.map((step, idx) => {
                            const StepIcon = step.icon;
                            return (
                              <div key={idx} className="relative flex md:flex-col items-start md:items-center gap-3 md:gap-2 text-left md:text-center">
                                {/* Connector Line (desktop) */}
                                {idx < timeline.length - 1 && (
                                  <div className={`hidden md:block absolute top-5 left-[60%] w-[80%] h-[2px] z-0 ${
                                    step.done ? 'bg-black' : 'bg-gray-100'
                                  }`} />
                                )}

                                {/* Icon Circle */}
                                <div className={`relative z-10 p-2.5 rounded-full flex items-center justify-center border ${
                                  step.active 
                                    ? step.label === 'Cancelled' || step.label === 'Returned'
                                      ? 'bg-red-50 border-red-500 text-red-500' 
                                      : 'bg-black border-black text-white' 
                                    : 'bg-white border-gray-200 text-gray-300'
                                }`}>
                                  <StepIcon size={16} />
                                </div>

                                <div className="space-y-0.5">
                                  <p className={`text-xs font-bold ${
                                    step.active 
                                      ? step.label === 'Cancelled' || step.label === 'Returned'
                                        ? 'text-red-500'
                                        : 'text-gray-900' 
                                      : 'text-gray-400'
                                  }`}>
                                    {step.label}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-light leading-snug max-w-[130px] md:mx-auto">
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items lists */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ordered Products</h4>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
                          {order.items && order.items.length > 0 ? (
                            order.items.map((item: MockOrderItem, i: number) => (
                              <div key={i} className="flex justify-between items-center p-4 text-xs">
                                <div className="space-y-0.5">
                                  <p className="font-bold text-gray-800">{item.productName}</p>
                                  <p className="text-[10px] text-gray-400 font-light font-mono">
                                    Size: {item.size} · Qty: {item.quantity}
                                  </p>
                                </div>
                                <span className="font-bold text-gray-900">{formatPrice(item.price * item.quantity)}</span>
                              </div>
                            ))
                          ) : (
                            <p className="p-4 text-xs text-gray-400 font-light">Product details are currently unavailable.</p>
                          )}
                        </div>
                      </div>

                      {/* Total details summary */}
                      <div className="flex justify-end pt-2">
                        <div className="w-full sm:w-64 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm space-y-2 text-xs">
                          <div className="flex justify-between text-gray-500 font-light">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.totalAmount + (order.discountAmount || 0))}</span>
                          </div>
                          {order.discountAmount && order.discountAmount > 0 ? (
                            <div className="flex justify-between text-red-500 font-medium">
                              <span>Promo Discount ({order.couponCode})</span>
                              <span>-{formatPrice(order.discountAmount)}</span>
                            </div>
                          ) : null}
                          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-50 pt-2 text-sm">
                            <span>Total</span>
                            <span>{formatPrice(order.totalAmount)}</span>
                          </div>
                          <div className="text-[10px] font-light text-gray-400 pt-1 text-right italic font-mono">
                            Payment: {order.paymentMethod} ({order.paymentStatus})
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
            <ClipboardList size={32} className="mx-auto text-gray-300 animate-pulse" />
            <div>
              <p className="text-lg font-medium text-gray-700">No Orders Found</p>
              <p className="text-xs text-gray-400 font-light">You haven&apos;t placed any orders with {user.email} yet.</p>
            </div>
            <Link href="/" className="inline-block bg-black text-white px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-colors">
              Shop Menswear
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
