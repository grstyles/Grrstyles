'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { repo, MockOrder, MockOrderItem } from '@/lib/repositories';
import { ClipboardList, RefreshCw, Search, User as UserIcon, Package } from 'lucide-react';
import { addToast } from '@/lib/redux/slices/uiSlice';
import { useDispatch } from 'react-redux';
import { formatPrice } from '@/lib/utils/helpers';
import { OrderStatusBadge } from '@/components/ui/OrderStatusBadge';

const STATUS_OPTIONS: MockOrder['status'][] = [
  'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned',
];



export default function AdminOrdersPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [orders, setOrders] = useState<MockOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await repo.orders.getAll();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Status changes will now be handled inside the Order Details page.

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = filterStatus === 'All' || o.status === filterStatus;
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch = !term ||
      o.id.toLowerCase().includes(term) ||
      o.customerName.toLowerCase().includes(term) ||
      o.email.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  // Summary counts
  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900 uppercase">Orders</h1>
          <p className="text-sm text-gray-400 mt-1">{orders.length} total orders · Real-time status management</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order / customer..."
              className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-black placeholder-gray-300 font-semibold"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            onClick={loadOrders}
            className="p-2.5 border border-gray-200 hover:border-black rounded-xl text-gray-500 hover:text-black transition-colors"
            title="Reload"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Status Filter Pills + Counts */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus('All')}
          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${filterStatus === 'All' ? 'bg-black text-white border-black' : 'text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
        >
          All ({orders.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all ${
              filterStatus === s
                ? 'bg-black text-white border-black'
                : 'text-gray-500 border-gray-200 hover:border-black hover:text-black'
            }`}
          >
            {s} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Order Registry</h3>
          <span className="text-xs text-gray-400">{filteredOrders.length} orders</span>
        </div>

        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  <th className="p-4 pl-6">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 pr-6 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredOrders.map((o) => (
                  <tr 
                    key={o.id} 
                    onClick={() => router.push(`/admin/orders/${o.id}`)}
                    className="hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        {o.items && o.items[0]?.image ? (
                          <img src={o.items[0].image} alt="Thumbnail" className="w-10 h-10 object-cover rounded-lg border border-gray-100" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <Package size={16} className="text-gray-400" />
                          </div>
                        )}
                        <div>
                          <span className="font-mono font-bold text-gray-900 tracking-wide text-xs block group-hover:text-black">{o.orderNumber || o.id}</span>
                          <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">{o.itemsCount} items</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserIcon size={12} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 uppercase text-[11px]">{o.customerName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{o.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-bold text-gray-800 uppercase">{o.paymentMethod === 'razorpay' ? 'Razorpay' : o.paymentMethod || 'COD'}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          o.paymentStatus === 'Paid' ? 'bg-green-50 text-green-600 border-green-100' :
                          o.paymentStatus === 'Refunded' ? 'bg-orange-50 text-orange-500 border-orange-100' :
                          o.paymentStatus === 'Failed' ? 'bg-red-50 text-red-500 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {o.paymentStatus || 'Pending'}
                        </span>
                        {o.razorpay_payment_id && (
                          <span className="text-[8px] font-mono text-gray-400 max-w-[80px] truncate" title={o.razorpay_payment_id}>
                            {o.razorpay_payment_id}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <OrderStatusBadge status={o.status} className="scale-90 origin-left" />
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-[11px]">{o.date}</td>
                    <td className="p-4 pr-6 text-right font-bold text-gray-900">
                      {formatPrice(o.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <ClipboardList size={28} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No orders found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
